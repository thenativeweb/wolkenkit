import { CommandData } from '../../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../../common/elements/CommandWithMetadata';
import { DomainPriorityQueue } from './DomainPriorityQueue';
declare const keepRenewingLock: ({ command, handleCommandPromise, priorityQueue, token }: {
    command: CommandWithMetadata<CommandData>;
    handleCommandPromise: Promise<any>;
    priorityQueue: DomainPriorityQueue;
    token: string;
}) => Promise<void>;
export { keepRenewingLock };
