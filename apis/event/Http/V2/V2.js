'use strict';

const cloneDeep = require('lodash/cloneDeep'),
      express = require('express'),
      Limes = require('limes'),
      partOf = require('partof');

const { AggregateReadable, EventInternal } = require('../../../../common/elements'),
      { AppService, ClientService, LoggerService } = require('../../../../common/services'),
      ClientMetadata = require('../../../../common/utils/http/ClientMetadata'),
      getConfiguration = require('./getConfiguration'),
      getEvents = require('./getEvents'),
      postEvent = require('./postEvent');

class V2 {
  constructor ({
    purpose,
    onReceiveEvent,
    application,
    repository,
    identityProviders,
    heartbeatInterval
  }) {
    if (!purpose) {
      throw new Error('Purpose is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }
    if (!repository) {
      throw new Error('Repository is missing.');
    }
    if (!identityProviders) {
      throw new Error('Identity providers are missing.');
    }
    if (!heartbeatInterval) {
      throw new Error('Heartbeat interval is missing.');
    }

    if (![ 'internal', 'external' ].includes(purpose)) {
      throw new Error(`Purpose must either be 'internal' or 'external'.`);
    }

    this.writeLine = this.writeLine.bind(this);

    this.purpose = purpose;
    this.application = application;
    this.repository = repository;

    const limes = new Limes({ identityProviders });
    const verifyTokenMiddleware = limes.verifyTokenMiddleware({
      // According to RFC 2606, .invalid is a reserved TLD you can use in cases
      // where you want to show that a domain is invalid. Since the tokens issued
      // for anonymous users are made-up, https://token.invalid makes up a valid
      // url, but we are sure that we do not run into any conflicts with the
      // domain.
      issuerForAnonymousTokens: 'https://token.invalid'
    });

    this.api = express();

    switch (purpose) {
      case 'internal':
        if (!onReceiveEvent) {
          throw new Error('On receive event is missing.');
        }

        this.api.post('/', postEvent({
          onReceiveEvent,
          application
        }));

        break;
      case 'external':
        this.api.get('/configuration', getConfiguration({ application }));

        this.connectionsForGetEvents = {};
        this.api.get('/', verifyTokenMiddleware, getEvents({
          connections: this.connectionsForGetEvents,
          writeLine: this.writeLine,
          heartbeatInterval
        }));

        break;
      default:
        throw new Error('Invalid operation.');
    }
  }

  writeLine ({ connectionId, data }) {
    if (!connectionId) {
      throw new Error('Connection id is missing.');
    }
    if (!data) {
      throw new Error('Data is missing.');
    }

    if (this.purpose !== 'external') {
      throw new Error('Invalid operation.');
    }

    const connection = this.connectionsForGetEvents[connectionId];

    // Maybe the connection has been removed in the background, so we can not
    // assume that it definitely exists. If we try to access a non-existing
    // connection, simply ignore it.
    if (!connection) {
      return;
    }

    const { res } = connection;

    try {
      res.write(`${JSON.stringify(data)}\n`);
    } catch (ex) {
      if (ex.code === 'ERR_STREAM_WRITE_AFTER_END') {
        // Ignore write after end errors. This simply means that the connection
        // was closed concurrently, and we can't do anything about it anyway.
        // Hence, remove the connection from the list of connections, and
        // return.
        Reflect.removeProperty(this.connectionsForGetEvents, connectionId);

        return;
      }

      throw ex;
    }
  }

  async prepareEvent ({ connectionId, event }) {
    if (!connectionId) {
      throw new Error('Connection id is missing.');
    }
    if (!event) {
      throw new Error('Event is missing.');
    }
    if (!(event instanceof EventInternal)) {
      throw new Error('Event must be internal.');
    }

    if (this.purpose !== 'external') {
      throw new Error('Invalid operation.');
    }

    const connection = this.connectionsForGetEvents[connectionId];

    // Maybe the connection has been removed in the background, so we can not
    // assume that it definitely exists. If we try to access a non-existing
    // connection, simply ignore it.
    if (!connection) {
      return;
    }

    const { application, repository } = this;
    const { req } = connection;

    let clientMetadata;

    try {
      clientMetadata = new ClientMetadata({ req });
    } catch (ex) {
      // It can happen that the connection gets closed in the background, and
      // hence the underlying socket does not have a remote address any more.
      // We can't detect this using an if statement, because connection handling
      // is done by Node.js in a background thread, and we may have a race
      // condition here. So, we decided to actively catch this exception, and
      // take it as an indicator that the connection has been closed meanwhile.
      if (ex.message === 'Remote address is missing.') {
        return;
      }

      throw ex;
    }

    const queryFilter = req.query || {};

    EventInternal.validate({ event, application });

    if (!partOf(queryFilter, event)) {
      return;
    }

    const services = {
      app: new AppService({ application, repository, capabilities: { readAggregates: true }}),
      client: new ClientService({ clientMetadata }),
      logger: new LoggerService({ fileName: `/server/domain/${event.context.name}/${event.aggregate.name}.js` })
    };

    const aggregateInstance = new AggregateReadable({
      application,
      context: { name: event.context.name },
      aggregate: { name: event.aggregate.name, id: event.aggregate.id }
    });

    aggregateInstance.applySnapshot({
      snapshot: {
        revision: event.metadata.revision,
        state: event.annotations.state
      }
    });

    // Additionally, attach the previous state, and do this in the same way as
    // applySnapshot works.
    aggregateInstance.api.forReadOnly.previousState = event.annotations.previousState;
    aggregateInstance.api.forEvents.previousState = event.annotations.previousState;

    const { isAuthorized, filter, map } =
      application.events.internal[event.context.name][event.aggregate.name][event.name];

    try {
      const clonedEvent = cloneDeep(event);
      const isEventAuthorized =
        await isAuthorized(aggregateInstance.api.forReadOnly, clonedEvent, services);

      if (!isEventAuthorized) {
        return;
      }
    } catch (ex) {
      services.logger.error('Is authorized failed.', { event, clientMetadata, ex });

      return;
    }

    if (filter) {
      try {
        const clonedEvent = cloneDeep(event);
        const keepEvent =
          await filter(aggregateInstance.api.forReadOnly, clonedEvent, services);

        if (!keepEvent) {
          return;
        }
      } catch (ex) {
        services.logger.error('Filter failed.', { event, clientMetadata, ex });

        return;
      }
    }

    let mappedEvent = event;

    if (map) {
      try {
        const clonedEvent = cloneDeep(event);

        mappedEvent =
          await map(aggregateInstance.api.forReadOnly, clonedEvent, services);

        mappedEvent = EventInternal.fromObject(mappedEvent);
      } catch (ex) {
        services.logger.error('Map failed.', { event, clientMetadata, ex });

        return;
      }
    }

    return mappedEvent;
  }

  async sendEvent ({ event }) {
    if (!event) {
      throw new Error('Event is missing.');
    }
    if (!(event instanceof EventInternal)) {
      throw new Error('Event must be internal.');
    }

    if (this.purpose !== 'external') {
      throw new Error('Invalid operation.');
    }

    for (const connectionId of Object.keys(this.connectionsForGetEvents)) {
      const preparedEvent = await this.prepareEvent({ connectionId, event });

      if (!preparedEvent) {
        continue;
      }

      const externalEvent = preparedEvent.asExternal();

      this.writeLine({ connectionId, data: externalEvent });
    }
  }
}

module.exports = V2;
