import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { AggregatesService } from '../services/AggregatesService';
import { Application } from '../application/Application';
import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandService } from '../services/CommandService';
import { ConsumerProgressStore } from '../../stores/consumerProgressStore/ConsumerProgressStore';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { errors } from '../errors';
import { flaschenpost } from 'flaschenpost';
import { LockService } from '../services/LockService';
import { LoggerService } from '../services/LoggerService';
import { TellInfrastructure } from '../elements/TellInfrastructure';

const logger = flaschenpost.getLogger();

const executeFlow = async function <TInfrastructure extends AskInfrastructure & TellInfrastructure> ({
  application,
  flowName,
  domainEvent,
  flowProgressStore,
  services,
  requestReplay
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
  };
  requestReplay: (parameters: {
    flowName: string;
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    from: number;
    to: number;
  }) => void | Promise<void>;
}): Promise<'acknowledge' | 'defer'> {
  if (!(flowName in application.flows)) {
    throw new errors.FlowNotFound(`Flow '${flowName}' not found.`);
  }

  const flowDefinition = application.flows[flowName];

  const { revision: latestHandledRevision, isReplaying } = await flowProgressStore.getProgress({
    consumerId: flowName,
    aggregateIdentifier: domainEvent.aggregateIdentifier
  });

  if (latestHandledRevision >= domainEvent.metadata.revision) {
    return 'acknowledge';
  }

  if (latestHandledRevision < domainEvent.metadata.revision - 1) {
    switch (flowDefinition.replayPolicy) {
      case 'never': {
        break;
      }
      case 'on-demand': {
        return 'defer';
      }
      case 'always': {
        if (!isReplaying) {
          const from = latestHandledRevision + 1,
                to = domainEvent.metadata.revision - 1;

          await requestReplay({
            flowName,
            contextIdentifier: domainEvent.contextIdentifier,
            aggregateIdentifier: domainEvent.aggregateIdentifier,
            from,
            to
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
      try {
        await handler.handle(domainEvent, services);
      } catch (ex) {
        logger.error(`The flow handler '${flowName}.${handlerName}' threw an error.`, { ex });

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

  return 'acknowledge';
};

export { executeFlow };
