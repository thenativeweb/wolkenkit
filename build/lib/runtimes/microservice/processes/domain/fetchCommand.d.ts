import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { LockMetadata } from '../../../../stores/priorityQueueStore/LockMetadata';
declare const fetchCommand: ({ commandDispatcher }: {
    commandDispatcher: CommandDispatcher;
}) => Promise<{
    command: CommandWithMetadata<CommandData>;
    metadata: LockMetadata;
}>;
export { fetchCommand };
