import { CommandData } from '../../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../../common/elements/CommandWithMetadata';
import { DomainPriorityQueue } from './DomainPriorityQueue';
import { LockMetadata } from '../../../../../stores/priorityQueueStore/LockMetadata';
declare const fetchCommand: ({ priorityQueue }: {
    priorityQueue: DomainPriorityQueue;
}) => Promise<{
    command: CommandWithMetadata<CommandData>;
    metadata: LockMetadata;
}>;
export { fetchCommand };
