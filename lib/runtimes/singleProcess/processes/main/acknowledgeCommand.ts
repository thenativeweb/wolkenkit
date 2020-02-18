import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { PriorityQueue } from './PriorityQueue';

const acknowledgeCommand = async function ({ command, token, priorityQueue }: {
  command: CommandWithMetadata<CommandData>;
  token: string;
  priorityQueue: PriorityQueue;
}): Promise<void> {
  await priorityQueue.store.acknowledge({
    itemIdentifier: command.getItemIdentifier(),
    token
  });
};

export {
  acknowledgeCommand
};
