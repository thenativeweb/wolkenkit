import { FlowHandler } from 'wolkenkit';
import { Infrastructure } from '../../../infrastructure';
import { ExecutedData } from '../../../domain/sampleContext/sampleAggregate/domainEvents/executed';

export const sampleHandler: FlowHandler<ExecutedData, Infrastructure> = {
  isRelevant ({ fullyQualifiedName }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  handle (domainEvent, { logger }) {
    logger.info('Received domain event.', { domainEvent });
  }
};
