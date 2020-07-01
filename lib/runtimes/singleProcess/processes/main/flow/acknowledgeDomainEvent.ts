import { FlowPriorityQueue } from './FlowPriorityQueue';

const acknowledgeDomainEvent = async function ({ flowName, token, priorityQueue }: {
  flowName: string;
  token: string;
  priorityQueue: FlowPriorityQueue;
}): Promise<void> {
  await priorityQueue.store.acknowledge({
    discriminator: flowName,
    token
  });
};

export {
  acknowledgeDomainEvent
};
