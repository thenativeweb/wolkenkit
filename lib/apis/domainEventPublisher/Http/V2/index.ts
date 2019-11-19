import { AggregatesService } from '../../../../../lib/common/services/AggregatesService';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { cloneDeep } from 'lodash';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventHandler } from '../../../../../lib/common/elements/DomainEventHandler';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import express from 'express';
import { getAggregatesService } from '../../../../common/services/getAggregatesService';
import { getClientService } from '../../../../common/services/getClientService';
import { getDescription } from './getDescription';
import { getDomainEvents } from './getDomainEvents';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { join } from 'path';
import { LoggerService } from '../../../../common/services/LoggerService';
import { partOf } from 'partof';
import { Repository } from '../../../../common/domain/Repository';
import { State } from '../../../../common/elements/State';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';
import { Express, Request, Response } from 'express-serve-static-core';
import { IdentityProvider, Limes } from 'limes';

class V2 {
  public api: Express;

  public connectionsForGetDomainEvents: Map<string, { req: Request; res: Response }>;

  protected applicationDefinition: ApplicationDefinition;

  protected repository: Repository;

  public constructor ({
    applicationDefinition,
    repository,
    identityProviders,
    heartbeatInterval
  }: {
    applicationDefinition: ApplicationDefinition;
    repository: Repository;
    identityProviders: IdentityProvider[];
    heartbeatInterval: number;
  }) {
    this.applicationDefinition = applicationDefinition;
    this.repository = repository;
    this.connectionsForGetDomainEvents = new Map();

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

    this.api.get('/description', getDescription({ applicationDefinition }));

    this.api.get('/', verifyTokenMiddleware, getDomainEvents({
      connections: this.connectionsForGetDomainEvents,
      writeLine: this.writeLine.bind(this),
      heartbeatInterval
    }));
  }

  public writeLine ({ connectionId, data }: {
    connectionId: string;
    data: object;
  }): void {
    const connection = this.connectionsForGetDomainEvents.get(connectionId);

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
        this.connectionsForGetDomainEvents.delete(connectionId);

        return;
      }

      throw ex;
    }
  }

  public async prepareDomainEvent ({
    connectionId,
    domainEvent,
    aggregatesService,
    loggerService
  }: {
    connectionId: string;
    domainEvent: DomainEventWithState<DomainEventData, State>;
    aggregatesService: AggregatesService;
    loggerService: LoggerService;
  }): Promise<DomainEvent<DomainEventData> | undefined> {
    const connection = this.connectionsForGetDomainEvents.get(connectionId);

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

    validateDomainEventWithState({ domainEvent, applicationDefinition: this.applicationDefinition });

    if (!partOf(queryFilter, domainEvent)) {
      return;
    }

    const services = {
      aggregates: aggregatesService,
      client: getClientService({ clientMetadata }),
      logger: loggerService
    };

    const aggregateInstance = await this.repository.loadCurrentAggregateState({
      contextIdentifier: domainEvent.contextIdentifier,
      aggregateIdentifier: domainEvent.aggregateIdentifier
    });

    const domainEventHandler: DomainEventHandler<State, DomainEventData> =
      this.applicationDefinition.domain[domainEvent.contextIdentifier.name]![domainEvent.aggregateIdentifier.name]!.domainEventHandlers[domainEvent.name]!;

    try {
      const clonedDomainEvent = cloneDeep(domainEvent);
      const isDomainEventAuthorized =
        await domainEventHandler.isAuthorized(aggregateInstance.state, clonedDomainEvent, services);

      if (!isDomainEventAuthorized) {
        return;
      }
    } catch (ex) {
      services.logger.error('Is authorized failed.', { domainEvent, clientMetadata, ex });

      return;
    }

    if (domainEventHandler.filter) {
      try {
        const clonedDomainEvent = cloneDeep(domainEvent);
        const keepDomainEvent =
          await domainEventHandler.filter(aggregateInstance.state, clonedDomainEvent, services);

        if (!keepDomainEvent) {
          return;
        }
      } catch (ex) {
        services.logger.error('Filter failed.', { event: domainEvent, clientMetadata, ex });

        return;
      }
    }

    let mappedDomainEvent = domainEvent;

    if (domainEventHandler.map) {
      try {
        const clonedDomainEvent = cloneDeep(domainEvent);

        mappedDomainEvent =
          await domainEventHandler.map(aggregateInstance.state, clonedDomainEvent, services);
      } catch (ex) {
        services.logger.error('Map failed.', { domainEvent, clientMetadata, ex });

        return;
      }
    }

    return mappedDomainEvent.withoutState();
  }

  public async publishDomainEvent ({ domainEvent }: {
    domainEvent: DomainEventWithState<DomainEventData, State>;
  }): Promise<void> {
    const aggregatesService = getAggregatesService({ applicationDefinition: this.applicationDefinition, repository: this.repository });
    const loggerService = getLoggerService({
      fileName: join(this.applicationDefinition.rootDirectory, `server/domain/${domainEvent.contextIdentifier.name}/${domainEvent.aggregateIdentifier.name}/index.js`),
      packageManifest: this.applicationDefinition.packageManifest
    });

    for (const connectionId of Object.keys(this.connectionsForGetDomainEvents)) {
      let preparedDomainEvent;

      try {
        preparedDomainEvent = await this.prepareDomainEvent({ connectionId, domainEvent, aggregatesService, loggerService });
      } catch (ex) {
        loggerService.error('Preparing domain event failed.', { domainEvent, ex });

        continue;
      }

      if (!preparedDomainEvent) {
        continue;
      }

      this.writeLine({ connectionId, data: preparedDomainEvent });
    }
  }
}

export { V2 };
