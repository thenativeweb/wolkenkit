import { acknowledgeDomainEvent } from './acknowledgeDomainEvent';
import { Application } from '../../../../../common/application/Application';
import { CommandData } from '../../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../../common/elements/CommandWithMetadata';
import { ConsumerProgressStore } from '../../../../../stores/consumerProgressStore/ConsumerProgressStore';
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
import { Parser } from 'validate-value';
import { PerformReplay } from '../../../../../common/domain/PerformReplay';
import { Repository } from '../../../../../common/domain/Repository';
import { withLogMetadata } from '../../../../../common/utils/logging/withLogMetadata';
import * as errors from '../../../../../common/errors';

const logger = flaschenpost.getLogger();

const domainEventParser = new Parser(getDomainEventSchema());

const processDomainEvent = async function ({
  application,
  priorityQueue,
  consumerProgressStore,
  lockStore,
  repository,
  issueCommand,
  performReplay
}: {
  application: Application;
  priorityQueue: FlowPriorityQueue;
  consumerProgressStore: ConsumerProgressStore;
  lockStore: LockStore;
  repository: Repository;
  issueCommand: (parameters: { command: CommandWithMetadata<CommandData> }) => void | Promise<void>;
  performReplay: PerformReplay;
}): Promise<void> {
  const { domainEvent, metadata } = await fetchDomainEvent({ priorityQueue });
  const flowName = metadata.discriminator;

  logger.debug(
    'Fetched and locked domain event for flow execution.',
    withLogMetadata('runtime', 'singleProcess/main', { itemIdentifier: domainEvent.getItemIdentifier(), metadata })
  );

  try {
    domainEventParser.parse(
      domainEvent,
      { valueName: 'domainEvent' }
    ).unwrapOrThrow(
      (err): Error => new errors.DomainEventMalformed(err.message)
    );

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
      performReplay
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async (): Promise<void> => {
      await keepRenewingLock({ flowName, flowPromise, priorityQueue, token: metadata.token });
    })();

    const howToProceed = await flowPromise;

    switch (howToProceed) {
      case 'acknowledge': {
        await acknowledgeDomainEvent({ flowName, token: metadata.token, priorityQueue });

        logger.debug(
          'Acknowledged domain event.',
          withLogMetadata('runtime', 'singleProcess/main', { itemIdentifier: domainEvent.getItemIdentifier(), metadata })
        );
        break;
      }
      case 'defer': {
        await priorityQueue.store.defer({
          discriminator: flowName,
          priority: domainEvent.metadata.timestamp,
          token: metadata.token
        });

        logger.debug(
          'Skipped and deferred domain event.',
          withLogMetadata('runtime', 'singleProcess/main', { itemIdentifier: domainEvent.getItemIdentifier(), metadata })
        );
        break;
      }
      default: {
        throw new errors.InvalidOperation();
      }
    }
  } catch (ex: unknown) {
    logger.error(
      'Failed to handle domain event.',
      withLogMetadata('runtime', 'singleProcess/main', { domainEvent, error: ex })
    );

    await acknowledgeDomainEvent({ flowName, token: metadata.token, priorityQueue });
  }
};

export { processDomainEvent };
