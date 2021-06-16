import { CommandDispatcher } from './CommandDispatcher';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { Repository } from '../../../../common/domain/Repository';
declare const processCommand: ({ commandDispatcher, repository, publishDomainEvents }: {
    commandDispatcher: CommandDispatcher;
    repository: Repository;
    publishDomainEvents: PublishDomainEvents;
}) => Promise<void>;
export { processCommand };
