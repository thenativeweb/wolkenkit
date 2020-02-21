import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { PriorityQueue } from './PriorityQueue';
import { retry } from 'retry-ignore-abort';

const fetchCommand = async function ({ priorityQueue }: {
  priorityQueue: PriorityQueue;
}): Promise<{
    command: CommandWithMetadata<CommandData>;
    token: string;
  }> {
  const { item, token } = await retry(
    async (): Promise<{
      item: CommandWithMetadata<CommandData>;
      token: string;
    }> => {
      const lock = await priorityQueue.store.lockNext();

      if (lock === undefined) {
        throw new Error('Command queue is empty.');
      }

      return lock;
    },
    { retries: Number.POSITIVE_INFINITY, maxTimeout: 1000 }
  );

  return { command: item, token };
};

export {
  fetchCommand
};
