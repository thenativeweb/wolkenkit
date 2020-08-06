import { FlowUpdatedNotificationDefinition } from '../../../notifications/definitions/FlowUpdatedNotificationDefinition';
import { Infrastructure } from '../../../infrastructure';
import { ExecutedData } from '../../../domain/sampleContext/sampleAggregate/domainEvents/executed';
// @ts-ignore
import { DomainEvent, DomainEventData, FlowHandler, LoggerService, NotificationService } from 'wolkenkit';

export const sampleHandler: FlowHandler<ExecutedData, Infrastructure> = {
  isRelevant ({ fullyQualifiedName }: {
    fullyQualifiedName: string;
  }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  handle (domainEvent: DomainEvent<DomainEventData>, { infrastructure, logger, notification }: {
    infrastructure: Infrastructure;
    logger: LoggerService;
    notification: NotificationService;
  }) {
    logger.info('Received domain event.', { domainEvent });

    infrastructure.tell.viewStore.domainEvents.push(domainEvent);

    notification.publish<FlowUpdatedNotificationDefinition>('flowSampleFlowUpdated', {});
  }
};
