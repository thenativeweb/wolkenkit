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
import { isCustomError } from 'defekt';
import PQueue from 'p-queue';
import { prepareForPublication } from '../../../../common/domain/domainEvent/prepareForPublication';
import { Repository } from '../../../../common/domain/Repository';
import { Schema } from '../../../../common/elements/Schema';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
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
    } as Schema
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
        try {
          querySchema.validate(req.query, { valueName: 'requestQuery' });
        } catch (ex: unknown) {
          throw new errors.RequestMalformed((ex as Error).message);
        }

        const domainEventQueue = new PQueue({ concurrency: 1 });

        const clientService = getClientService({ clientMetadata: new ClientMetadata({ req }) });
        const domainEventFilter = (req.query.filter ?? {}) as Record<string, unknown>;

        const handleDomainEvent = (domainEventWithState: DomainEventWithState<DomainEventData, State>): void => {
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
                  fileName: `<app>/server/domain/${domainEventWithState.aggregateIdentifier.context.name}/${domainEventWithState.aggregateIdentifier.aggregate.name}/`,
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

            responseBodySchema.validate(domainEvent, { valueName: 'responseBody' });

            logger.debug(
              'Publishing domain event to client...',
              withLogMetadata('api', 'observeDomainEvents', { domainEvent })
            );

            writeLine({ res, data: domainEvent });
          });
          /* eslint-enable @typescript-eslint/no-floating-promises */
        };

        res.startStream({ heartbeatInterval });

        res.socket?.once('close', (): void => {
          domainEventEmitter.off(handleDomainEvent);
          domainEventQueue.clear();
        });

        domainEventEmitter.on(handleDomainEvent);
      } catch (ex: unknown) {
        // It can happen that the connection gets closed in the background, and
        // hence the underlying socket does not have a remote address any more. We
        // can't detect this using an if statement, because connection handling is
        // done by Node.js in a background thread, and we may have a race
        // condition here. So, we decided to actively catch this exception, and
        // take it as an indicator that the connection has been closed meanwhile.
        if (ex instanceof Error && ex.message === 'Remote address is missing.') {
          return;
        }

        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
          case errors.RequestMalformed.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'observeDomainEvents', { error })
            );
          }
        }
      }
    };
  }
};

export { getDomainEvents };
