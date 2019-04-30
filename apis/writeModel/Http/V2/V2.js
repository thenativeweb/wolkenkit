'use strict';

const cloneDeep = require('lodash/cloneDeep'),
      express = require('express'),
      Limes = require('limes'),
      partOf = require('partof');

const { AppService, ClientService, LoggerService } = require('../../../../common/services'),
      ClientMetadata = require('../../../../common/utils/http/ClientMetadata'),
      getConfiguration = require('./getConfiguration'),
      getEvents = require('./getEvents'),
      postCommand = require('./postCommand'),
      { ReadableAggregate } = require('../../../../common/elements'),
      { validateEvent } = require('../../../../common/validators');

class V2 {
  constructor ({
    onReceiveCommand,
    application,
    repository,
    identityProviders,
    heartbeatInterval
  }) {
    if (!onReceiveCommand) {
      throw new Error('On receive command is missing.');
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

    this.writeLine = this.writeLine.bind(this);

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

    this.api.get('/configuration', getConfiguration({
      application
    }));

    this.api.post('/command', verifyTokenMiddleware, postCommand({
      onReceiveCommand,
      application,
      repository
    }));

    this.connectionsForGetEvents = {};
    this.api.get('/events', verifyTokenMiddleware, getEvents({
      connections: this.connectionsForGetEvents,
      writeLine: this.writeLine,
      heartbeatInterval
    }));
  }

  writeLine ({ connectionId, data }) {
    if (!connectionId) {
      throw new Error('Connection id is missing.');
    }
    if (!data) {
      throw new Error('Data is missing.');
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

  async prepareEvent ({ connectionId, event, metadata: eventMetadata }) {
    if (!connectionId) {
      throw new Error('Connection id is missing.');
    }
    if (!event) {
      throw new Error('Event is missing.');
    }
    if (!eventMetadata) {
      throw new Error('Metadata are missing.');
    }
    if (!eventMetadata.state) {
      throw new Error('State is missing.');
    }
    if (!eventMetadata.previousState) {
      throw new Error('Previous state is missing.');
    }

    const connection = this.connectionsForGetEvents[connectionId];

    // Maybe the connection has been removed in the background, so we can not
    // assume that it definitely exists. If we try to access a non-existing
    // connection, simply ignore it.
    if (!connection) {
      return;
    }

    const { application, repository } = this;
    const { writeModel } = application;

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

    validateEvent({ event, application });

    if (!partOf(queryFilter, event)) {
      return;
    }

    const metadata = { ...eventMetadata, client: clientMetadata };

    const services = {
      app: new AppService({ application, repository, capabilities: { readAggregates: true }}),
      client: new ClientService({ metadata }),
      logger: new LoggerService({ fileName: `/server/writeModel/${event.context.name}/${event.aggregate.name}.js` })
    };

    const aggregateInstance = new ReadableAggregate({
      writeModel,
      context: { name: event.context.name },
      aggregate: { name: event.aggregate.name, id: event.aggregate.id }
    });

    aggregateInstance.applySnapshot({
      revision: event.metadata.revision,
      state: eventMetadata.state
    });

    // Additionally, attach the previous state, and do this in the same way as
    // applySnapshot works.
    aggregateInstance.api.forReadOnly.previousState = eventMetadata.previousState;
    aggregateInstance.api.forEvents.previousState = eventMetadata.previousState;

    const { isAuthorized, filter, map } =
      writeModel[event.context.name][event.aggregate.name].events[event.name];

    try {
      const clonedEvent = cloneDeep(event);
      const isEventAuthorized =
        await isAuthorized(aggregateInstance.api.forReadOnly, clonedEvent, services);

      if (!isEventAuthorized) {
        return;
      }
    } catch (ex) {
      services.logger.error('Is authorized failed.', { event, metadata, ex });

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
        services.logger.error('Filter failed.', { event, metadata, ex });

        return;
      }
    }

    let mappedEvent = event;

    if (map) {
      try {
        const clonedEvent = cloneDeep(event);

        mappedEvent =
          await map(aggregateInstance.api.forReadOnly, clonedEvent, services);
      } catch (ex) {
        services.logger.error('Map failed.', { event, metadata, ex });

        return;
      }
    }

    return mappedEvent;
  }

  async sendEvent ({ event, metadata }) {
    if (!event) {
      throw new Error('Event is missing.');
    }
    if (!metadata) {
      throw new Error('Metadata are missing.');
    }

    for (const connectionId of Object.keys(this.connectionsForGetEvents)) {
      const preparedEvent = await this.prepareEvent({ connectionId, event, metadata });

      if (!preparedEvent) {
        continue;
      }

      this.writeLine({ connectionId, data: preparedEvent });
    }
  }
}

module.exports = V2;
