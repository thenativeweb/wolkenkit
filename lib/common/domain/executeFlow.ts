import { AggregatesService } from '../services/AggregatesService';
import { Application } from '../application/Application';
import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandService } from '../services/CommandService';
import { ConsumerProgressStore } from '../../stores/consumerProgressStore/ConsumerProgressStore';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { errors } from '../errors';
import { flaschenpost } from 'flaschenpost';
import { LockService } from '../services/LockService';
import { LoggerService } from '../services/LoggerService';
import { NotificationService } from '../services/NotificationService';
import { PerformReplay } from './PerformReplay';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import { withLogMetadata } from '../utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const executeFlow = async function <TInfrastructure extends AskInfrastructure & TellInfrastructure> ({
  application,
  flowName,
  domainEvent,
  flowProgressStore,
  services,
  performReplay
}: {
  application: Application;
  flowName: string;
  domainEvent: DomainEvent<DomainEventData>;
  flowProgressStore: ConsumerProgressStore;
  services: {
    aggregates: AggregatesService;
    command: CommandService;
    infrastructure: TInfrastructure;
    logger: LoggerService;
    lock: LockService;
    notification: NotificationService;
  };
  performReplay: PerformReplay;
}): Promise<'acknowledge' | 'defer'> {
  if (!(flowName in application.flows)) {
    throw new errors.FlowNotFound(`Flow '${flowName}' not found.`);
  }

  logger.debug(
    `Executing flow...`,
    withLogMetadata('common', 'executeFlow', { flowName, domainEvent })
  );

  const flowDefinition = application.flows[flowName];

  const { revision: latestHandledRevision, isReplaying } = await flowProgressStore.getProgress({
    consumerId: flowName,
    aggregateIdentifier: domainEvent.aggregateIdentifier
  });

  if (latestHandledRevision >= domainEvent.metadata.revision) {
    logger.debug(
      'Domain event was already seen, skipping.',
      withLogMetadata('common', 'executeFlow', { flowName })
    );

    return 'acknowledge';
  }

  if (latestHandledRevision < domainEvent.metadata.revision - 1) {
    switch (flowDefinition.replayPolicy) {
      case 'never': {
        logger.debug(
          `Domain event is too new. Ignoring due to replay policy 'never'.`,
          withLogMetadata('common', 'executeFlow', { flowName })
        );
        break;
      }
      case 'on-demand': {
        logger.debug(
          `Domain event is too new. Deferring due to replay policy 'on-demand'.`,
          withLogMetadata('common', 'executeFlow', { flowName })
        );

        return 'defer';
      }
      case 'always': {
        if (!isReplaying) {
          const from = latestHandledRevision + 1,
                to = domainEvent.metadata.revision - 1;

          logger.debug(
            `Domain event is too new. Requesting replay and deferring due to replay policy 'always'.`,
            withLogMetadata('common', 'executeFlow', { flowName, from, to })
          );

          await performReplay({
            flowNames: [ flowName ],
            aggregates: [{
              aggregateIdentifier: domainEvent.aggregateIdentifier,
              from,
              to
            }]
          });
          await flowProgressStore.setIsReplaying({
            consumerId: flowName,
            aggregateIdentifier: domainEvent.aggregateIdentifier,
            isReplaying: { from, to }
          });
        }

        return 'defer';
      }
      default: {
        throw new errors.InvalidOperation();
      }
    }
  }

  for (const [ handlerName, handler ] of Object.entries(flowDefinition.domainEventHandlers)) {
    if (handler.isRelevant({
      fullyQualifiedName: domainEvent.getFullyQualifiedName(),
      itemIdentifier: domainEvent.getItemIdentifier()
    })) {
      logger.debug(
        `Executing flow handler...`,
        withLogMetadata('common', 'executeFlow', { flowName, handlerName })
      );
      try {
        await handler.handle(domainEvent, services);
      } catch (ex: unknown) {
        logger.error(
          `A flow handler threw an error.`,
          withLogMetadata('common', 'executeFlow', { error: ex, flowName, handlerName })
        );

        throw ex;
      }
    }
  }

  await flowProgressStore.setProgress({
    consumerId: flowName,
    aggregateIdentifier: domainEvent.aggregateIdentifier,
    revision: domainEvent.metadata.revision
  });
  if (isReplaying && isReplaying.to === domainEvent.metadata.revision) {
    await flowProgressStore.setIsReplaying({
      consumerId: flowName,
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      isReplaying: false
    });
  }

  logger.debug(
    `Flow successfully executed.`,
    withLogMetadata('common', 'executeFlow', { flowName })
  );

  return 'acknowledge';
};

export { executeFlow };
