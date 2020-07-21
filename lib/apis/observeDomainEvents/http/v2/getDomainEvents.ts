import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getAggregatesService } from '../../../../common/services/getAggregatesService';
import { getClientService } from '../../../../common/services/getClientService';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import PQueue from 'p-queue';
import { prepareForPublication } from '../../../../common/domain/domainEvent/prepareForPublication';
import { Repository } from '../../../../common/domain/Repository';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';
import { Request, Response } from 'express';

const logger = flaschenpost.getLogger();

const getDomainEvents = {
  description: 'Streams domain events live.',
  path: '',

  request: {
    query: {
      type: 'object',
      properties: {
        filter: { type: 'object' }
      },
      additionalProperties: false
    }
  },
  response: {
    statusCodes: [ 200, 400 ],

    stream: true,
    body: getDomainEventSchema()
  },

  getHandler ({
    domainEventEmitter,
    application,
    repository,
    heartbeatInterval
  }: {
    domainEventEmitter: SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>;
    application: Application;
    repository: Repository;
    heartbeatInterval: number;
  }): WolkenkitRequestHandler {
    const querySchema = new Value(getDomainEvents.request.query),
          responseBodySchema = new Value(getDomainEvents.response.body);

    const aggregatesService = getAggregatesService({ repository });

    return async function (req: Request, res: Response): Promise<void> {
      try {
        querySchema.validate(req.query);
      } catch (ex) {
        res.status(400).end(ex.message);

        return;
      }

      const domainEventQueue = new PQueue({ concurrency: 1 });

      let handleDomainEvent: (domainEventWithState: DomainEventWithState<DomainEventData, State>) => void;

      try {
        const clientService = getClientService({ clientMetadata: new ClientMetadata({ req }) });
        const domainEventFilter = (req.query.filter ?? {}) as object;

        handleDomainEvent = (domainEventWithState): void => {
          /* eslint-disable @typescript-eslint/no-floating-promises */
          domainEventQueue.add(async (): Promise<void> => {
            const domainEvent = await prepareForPublication({
              domainEventWithState,
              domainEventFilter,
              application,
              repository,
              services: {
                aggregates: aggregatesService,
                client: clientService,
                logger: getLoggerService({
                  fileName: `<app>/server/domain/${domainEventWithState.contextIdentifier.name}/${domainEventWithState.aggregateIdentifier.name}/`,
                  packageManifest: application.packageManifest
                }),
                infrastructure: {
                  ask: application.infrastructure.ask
                }
              }
            });

            if (!domainEvent) {
              return;
            }

            responseBodySchema.validate(domainEvent);

            writeLine({ res, data: domainEvent });
          });
          /* eslint-enable @typescript-eslint/no-floating-promises */
        };
      } catch (ex) {
        logger.error('An unknown error occured.', { ex });

        const error = new errors.UnknownError();

        res.status(500).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      try {
        res.startStream({ heartbeatInterval });

        res.connection.once('close', (): void => {
          domainEventEmitter.off(handleDomainEvent);
          domainEventQueue.clear();
        });

        domainEventEmitter.on(handleDomainEvent);
      } catch (ex) {
        // It can happen that the connection gets closed in the background, and
        // hence the underlying socket does not have a remote address any more. We
        // can't detect this using an if statement, because connection handling is
        // done by Node.js in a background thread, and we may have a race
        // condition here. So, we decided to actively catch this exception, and
        // take it as an indicator that the connection has been closed meanwhile.
        if (ex.message === 'Remote address is missing.') {
          return;
        }

        logger.error('An unknown error occured.', { ex });

        throw ex;
      }
    };
  }
};

export { getDomainEvents };
