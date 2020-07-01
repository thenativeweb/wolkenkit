import { CommandData } from '../../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../../common/elements/CommandWithMetadata';
import { LockMetadata } from '../../../../../stores/priorityQueueStore/LockMetadata';
import { DomainPriorityQueue } from './DomainPriorityQueue';
import { retry } from 'retry-ignore-abort';

const fetchCommand = async function ({ priorityQueue }: {
  priorityQueue: DomainPriorityQueue;
}): Promise<{
    command: CommandWithMetadata<CommandData>;
    token: string;
  }> {
  const { item, metadata } = await retry(
    async (): Promise<{
      item: CommandWithMetadata<CommandData>;
      metadata: LockMetadata;
    }> => {
      const lock = await priorityQueue.store.lockNext();

      if (lock === undefined) {
        throw new Error('Command queue is empty.');
      }

      return lock;
    },
    { retries: Number.POSITIVE_INFINITY, maxTimeout: 1000 }
  );

  return { command: item, token: metadata.token };
};

export {
  fetchCommand
};
