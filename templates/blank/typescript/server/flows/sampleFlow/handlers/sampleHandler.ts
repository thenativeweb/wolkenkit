import { FlowUpdated } from '../../../notifications/definitions/FlowUpdated';
import { Infrastructure } from '../../../infrastructure';
import { DomainEventData, FlowHandler } from 'wolkenkit';

const sampleHandler: FlowHandler<DomainEventData, Infrastructure> = {
  isRelevant (): boolean {
    return true;
  },

  async handle (_domainEvent, { notification }): Promise<void> {
    // ...

    await notification.publish<FlowUpdated>('flowSampleFlowUpdated', {});
  }
};

export { sampleHandler };
