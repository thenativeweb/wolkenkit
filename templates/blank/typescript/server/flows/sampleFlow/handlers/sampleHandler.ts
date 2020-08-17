import { Infrastructure } from '../../../infrastructure';
import { DomainEventData, FlowHandler } from 'wolkenkit';

const sampleHandler: FlowHandler<DomainEventData, Infrastructure> = {
  isRelevant (): boolean {
    return true;
  },

  async handle (): Promise<void> {
    // ...
  }
};

export { sampleHandler };
