import { Infrastructure } from '../../../infrastructure';
import { ExecutedData } from '../../../domain/sampleContext/sampleAggregate/domainEvents/executed';
// @ts-ignore
import { FlowHandler, LoggerService } from 'wolkenkit';

export const sampleHandler: FlowHandler<ExecutedData, Infrastructure> = {
  isRelevant ({ fullyQualifiedName }: {
    fullyQualifiedName: string;
  }) {
    return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
  },

  handle (domainEvent: any, { logger }: {
    logger: LoggerService
  }) {
    logger.info('Received domain event.', { domainEvent });
  }
};
