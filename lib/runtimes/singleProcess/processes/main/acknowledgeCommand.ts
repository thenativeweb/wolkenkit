import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { PriorityQueue } from './PriorityQueue';

const acknowledgeCommand = async function ({ command, token, defer, priorityQueue }: {
  command: CommandWithMetadata<CommandData>;
  token: string;
  defer?: boolean;
  priorityQueue: PriorityQueue;
}): Promise<void> {
  await priorityQueue.store.acknowledge({
    itemIdentifier: command.getItemIdentifier(),
    token,
    defer
  });
};

export {
  acknowledgeCommand
};
