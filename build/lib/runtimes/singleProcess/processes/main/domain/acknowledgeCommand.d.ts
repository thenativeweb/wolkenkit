import { CommandData } from '../../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../../common/elements/CommandWithMetadata';
import { DomainPriorityQueue } from './DomainPriorityQueue';
declare const acknowledgeCommand: ({ command, token, priorityQueue }: {
    command: CommandWithMetadata<CommandData>;
    token: string;
    priorityQueue: DomainPriorityQueue;
}) => Promise<void>;
export { acknowledgeCommand };
