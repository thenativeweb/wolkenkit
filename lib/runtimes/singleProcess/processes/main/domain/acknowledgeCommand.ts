import { CommandData } from '../../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../../common/elements/CommandWithMetadata';
import { DomainPriorityQueue } from './DomainPriorityQueue';

const acknowledgeCommand = async function ({ command, token, priorityQueue }: {
  command: CommandWithMetadata<CommandData>;
  token: string;
  priorityQueue: DomainPriorityQueue;
}): Promise<void> {
  await priorityQueue.store.acknowledge({
    discriminator: command.aggregateIdentifier.id,
    token
  });
};

export {
  acknowledgeCommand
};
