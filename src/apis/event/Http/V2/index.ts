import Aggregate from '../../../../common/elements/Aggregate';
import AggregateApiForReadOnly from '../../../../common/elements/AggregateApiForReadOnly';
import Application from '../../../../common/application/Application';
import ClientMetadata from '../../../../common/utils/http/ClientMetadata';
import cloneDeep from 'lodash/cloneDeep';
import { Dictionary } from '../../../../types/Dictionary';
import errors from '../../../../common/errors';
import EventInternal from '../../../../common/elements/EventInternal';
import express from 'express';
import getAggregateService from '../../../../common/services/getAggregateService';
import getClientService from '../../../../common/services/getClientService';
import getConfiguration from './getConfiguration';
import getEvents from './getEvents';
import getLoggerService from '../../../../common/services/getLoggerService';
import { join } from 'path';
import partOf from 'partof';
import { Purpose } from '../../../shared/Purpose';
import Repository from '../../../../common/domain/Repository';
import { Express, Request, Response } from 'express-serve-static-core';
import Limes, { IdentityProvider } from 'limes';
import postEvent, { OnReceiveEvent } from './postEvent';

class V2 {
  public api: Express;

  public connectionsForGetEvents: Dictionary<{ req: Request; res: Response }>;

  protected purpose: Purpose;

  protected application: Application;

  protected repository: Repository;

  public constructor ({
    purpose,
    onReceiveEvent,
    application,
    repository,
    identityProviders,
    heartbeatInterval
  }: {
    purpose: Purpose;
    onReceiveEvent: OnReceiveEvent;
    application: Application;
    repository: Repository;
    identityProviders: IdentityProvider[];
    heartbeatInterval: number;
  }) {
    this.purpose = purpose;
    this.application = application;
    this.repository = repository;
    this.connectionsForGetEvents = {};

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

        this.api.get('/', verifyTokenMiddleware, getEvents({
          connections: this.connectionsForGetEvents,
          writeLine: this.writeLine.bind(this),
          heartbeatInterval
        }));

        break;
      default:
        throw new errors.InvalidOperation(`Purpose should have been 'internal' or 'external'.`);
    }
  }

  public writeLine ({ connectionId, data }: {
    connectionId: string;
    data: object;
  }): void {
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
        delete this.connectionsForGetEvents[connectionId];

        return;
      }

      throw ex;
    }
  }

  public async prepareEvent ({ connectionId, event }: {
    connectionId: string;
    event: EventInternal;
  }): Promise<EventInternal | undefined> {
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

    EventInternal.validate({ event, application: this.application });

    if (!partOf(queryFilter, event)) {
      return;
    }

    const services = {
      app: {
        aggregates: getAggregateService({ application: this.application, repository: this.repository })
      },
      client: getClientService({ clientMetadata }),
      logger: getLoggerService({ fileName: join(this.application.rootDirectory, `server/domain/${event.contextIdentifier.name}/${event.aggregateIdentifier.name}.js`) })
    };

    const aggregateInstance = new Aggregate({
      contextIdentifier: event.contextIdentifier,
      aggregateIdentifier: event.aggregateIdentifier,
      initialState: this.application.initialState.internal[event.contextIdentifier.name]![event.aggregateIdentifier.name]!
    });

    aggregateInstance.applySnapshot({
      snapshot: {
        aggregateIdentifier: event.aggregateIdentifier,
        revision: event.metadata.revision.aggregate,
        state: event.annotations.state
      }
    });

    const aggregateApiForReadOnly = new AggregateApiForReadOnly({ aggregate: aggregateInstance });

    const { isAuthorized, filter, map } =
      this.application.events.internal[event.contextIdentifier.name]![event.aggregateIdentifier.name]![event.name]!;

    try {
      const clonedEvent = cloneDeep(event);
      const isEventAuthorized =
        await isAuthorized(aggregateApiForReadOnly, clonedEvent, services);

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
          await filter(aggregateApiForReadOnly, clonedEvent, services);

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
          await map(aggregateApiForReadOnly, clonedEvent, services);

        mappedEvent = EventInternal.deserialize(mappedEvent);
      } catch (ex) {
        services.logger.error('Map failed.', { event, clientMetadata, ex });

        return;
      }
    }

    return mappedEvent;
  }

  public async sendEvent ({ event }: {
    event: EventInternal;
  }): Promise<void> {
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

export default V2;
