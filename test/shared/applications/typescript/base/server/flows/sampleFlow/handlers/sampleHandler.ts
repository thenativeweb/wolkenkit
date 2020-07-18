import { Infrastructure } from '../../../infrastructure';
import { ExecutedData } from '../../../domain/sampleContext/sampleAggregate/domainEvents/executed';
// @ts-ignore
import { DomainEvent, DomainEventData, FlowHandler, LoggerService } from 'wolkenkit';

export const sampleHandler: FlowHandler<ExecutedData, Infrastructure> = {
  isRelevant ({ fullyQualifiedName }: {
    fullyQualifiedName: string;
  }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  handle (domainEvent: DomainEvent<DomainEventData>, { infrastructure, logger }: {
    infrastructure: Infrastructure;
    logger: LoggerService;
  }) {
    logger.info('Received domain event.', { domainEvent });

    infrastructure.tell.viewStore.domainEvents.push(domainEvent);
  }
};
