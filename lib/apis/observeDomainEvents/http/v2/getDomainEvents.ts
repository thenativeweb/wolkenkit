import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { flaschenpost } from 'flaschenpost';
import { getAggregatesService } from '../../../../common/services/getAggregatesService';
import { getClientService } from '../../../../common/services/getClientService';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import path from 'path';
import PQueue from 'p-queue';
import { prepareForPublication } from './shared/prepareForPublication';
import { Repository } from '../../../../common/domain/Repository';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { writeLine } from '../../../base/writeLine';
import { Request, RequestHandler, Response } from 'express';

const logger = flaschenpost.getLogger();

const getDomainEvents = function ({
  domainEventEmitter,
  applicationDefinition,
  repository
}: {
  domainEventEmitter: SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>;
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
}): RequestHandler {
  const aggregatesService = getAggregatesService({ applicationDefinition, repository });

  return async function (req: Request, res: Response): Promise<void> {
    try {
      const domainEventQueue = new PQueue({ concurrency: 1 });

      const clientService = getClientService({ clientMetadata: new ClientMetadata({ req }) });
      const domainEventFilter = req.query || {};

      const handleDomainEvent = (domainEventWithState: DomainEventWithState<DomainEventData, State>): void => {
        /* eslint-disable @typescript-eslint/no-floating-promises */
        domainEventQueue.add(async (): Promise<void> => {
          const domainEvent = await prepareForPublication({
            domainEventWithState,
            domainEventFilter,
            applicationDefinition,
            repository,
            services: {
              aggregates: aggregatesService,
              client: clientService,
              logger: getLoggerService({
                fileName: path.join(applicationDefinition.rootDirectory, `server/domain/${domainEventWithState.contextIdentifier.name}/${domainEventWithState.aggregateIdentifier.name}/index.js`),
                packageManifest: applicationDefinition.packageManifest
              })
            }
          });

          if (!domainEvent) {
            return;
          }

          writeLine({ res, data: domainEvent });
        });
        /* eslint-enable @typescript-eslint/no-floating-promises */
      };

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

      logger.error('An unexpected error occured.', { ex });

      throw ex;
    }
  };
};

export { getDomainEvents };
