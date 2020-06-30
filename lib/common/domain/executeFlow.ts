import { AggregatesService } from '../services/AggregatesService';
import { Application } from '../application/Application';
import { AskInfrastructure } from '../elements/AskInfrastructure';
import { ConsumerProgressStore } from '../../stores/consumerProgressStore/ConsumerProgressStore';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { errors } from '../errors';
import { flaschenpost } from 'flaschenpost';
import { LockService } from '../services/LockService';
import { LoggerService } from '../services/LoggerService';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import {CommandService} from "../services/CommandService";

const logger = flaschenpost.getLogger();

const executeFlow = async function <TInfrastructure extends AskInfrastructure & TellInfrastructure> ({
  application,
  flowName,
  domainEvent,
  flowProgressStore,
  services
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
}): Promise<void> {
  if (!(flowName in application.flows)) {
    throw new errors.FlowNotFound(`Flow '${flowName}' not found.`);
  }

  const flowDefinition = application.flows[flowName];

  const latestHandledRevision = await flowProgressStore.getProgress({
    consumerId: flowName,
    aggregateIdentifier: domainEvent.aggregateIdentifier
  });

  if (latestHandledRevision >= domainEvent.metadata.revision) {
    return;
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
};

export { executeFlow };
