import { acknowledgeDomainEvent } from './acknowledgeDomainEvent';
import { AggregateIdentifier } from '../../../../../common/elements/AggregateIdentifier';
import { Application } from '../../../../../common/application/Application';
import { CommandData } from '../../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../../common/elements/CommandWithMetadata';
import { ConsumerProgressStore } from '../../../../../stores/consumerProgressStore/ConsumerProgressStore';
import { errors } from '../../../../../common/errors';
import { executeFlow } from '../../../../../common/domain/executeFlow';
import { fetchDomainEvent } from './fetchDomainEvent';
import { flaschenpost } from 'flaschenpost';
import { FlowPriorityQueue } from './FlowPriorityQueue';
import { getAggregatesService } from '../../../../../common/services/getAggregatesService';
import { getCommandService } from '../../../../../common/services/getCommandService';
import { getDomainEventSchema } from '../../../../../common/schemas/getDomainEventSchema';
import { getLockService } from '../../../../../common/services/getLockService';
import { getLoggerService } from '../../../../../common/services/getLoggerService';
import { getNotificationService } from '../../../../../common/services/getNotificationService';
import { keepRenewingLock } from './keepRenewingLock';
import { LockStore } from '../../../../../stores/lockStore/LockStore';
import { Repository } from '../../../../../common/domain/Repository';
import { Value } from 'validate-value';

const logger = flaschenpost.getLogger();

const processDomainEvent = async function ({
  application,
  priorityQueue,
  consumerProgressStore,
  lockStore,
  repository,
  issueCommand,
  requestReplay
}: {
  application: Application;
  priorityQueue: FlowPriorityQueue;
  consumerProgressStore: ConsumerProgressStore;
  lockStore: LockStore;
  repository: Repository;
  issueCommand: (parameters: { command: CommandWithMetadata<CommandData> }) => void | Promise<void>;
  requestReplay: (parameters: { flowName: string; aggregateIdentifier: AggregateIdentifier; from: number; to: number }) => void | Promise<void>;
}): Promise<void> {
  const { domainEvent, metadata } = await fetchDomainEvent({ priorityQueue });
  const flowName = metadata.discriminator;

  logger.debug('Fetched and locked domain event for flow execution.', { itemIdentifier: domainEvent.getItemIdentifier(), metadata });

  try {
    try {
      new Value(getDomainEventSchema()).validate(domainEvent, { valueName: 'domainEvent' });
    } catch (ex) {
      throw new errors.DomainEventMalformed(ex.message);
    }

    if (!(flowName in application.flows)) {
      throw new errors.FlowNotFound(`Received a domain event for unknown flow '${flowName}'.`);
    }

    const flowPromise = executeFlow({
      application,
      domainEvent,
      flowName,
      flowProgressStore: consumerProgressStore,
      services: {
        aggregates: getAggregatesService({ repository }),
        command: getCommandService({ domainEvent, issueCommand }),
        infrastructure: application.infrastructure,
        logger: getLoggerService({
          fileName: `<app>/server/flows/${flowName}`,
          packageManifest: application.packageManifest
        }),
        lock: getLockService({ lockStore }),
        notification: getNotificationService({
          application,
          publisher: repository.publisher,
          channel: repository.pubSubChannelForNotifications
        })
      },
      requestReplay
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async (): Promise<void> => {
      await keepRenewingLock({ flowName, flowPromise, priorityQueue, token: metadata.token });
    })();

    const howToProceed = await flowPromise;

    switch (howToProceed) {
      case 'acknowledge': {
        await acknowledgeDomainEvent({ flowName, token: metadata.token, priorityQueue });

        logger.debug('Acknowledged domain event.', { itemIdentifier: domainEvent.getItemIdentifier(), metadata });
        break;
      }
      case 'defer': {
        await priorityQueue.store.defer({
          discriminator: flowName,
          priority: domainEvent.metadata.timestamp,
          token: metadata.token
        });

        logger.debug('Skipped and deferred domain event.', { itemIdentifier: domainEvent.getItemIdentifier(), metadata });
        break;
      }
      default: {
        throw new errors.InvalidOperation();
      }
    }
  } catch (ex) {
    logger.error('Failed to handle domain event.', { domainEvent, ex });

    await acknowledgeDomainEvent({ flowName, token: metadata.token, priorityQueue });
  }
};

export { processDomainEvent };
