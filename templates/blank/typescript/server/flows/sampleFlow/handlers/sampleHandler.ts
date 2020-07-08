import { Infrastructure } from '../../../infrastructure';
import { DomainEventData, FlowHandler } from 'wolkenkit';

const sampleHandler: FlowHandler<DomainEventData, Infrastructure> = {
  isRelevant () {
    return true;
  },

  async handle (domainEvent, { logger }) {
    logger.info('Received domain event.', { domainEvent });
  }
};

export { sampleHandler };
