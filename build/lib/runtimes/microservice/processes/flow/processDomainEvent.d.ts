import { Application } from '../../../../common/application/Application';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { ConsumerProgressStore } from '../../../../stores/consumerProgressStore/ConsumerProgressStore';
import { DomainEventDispatcher } from './DomainEventDispatcher';
import { LockStore } from '../../../../stores/lockStore/LockStore';
import { PerformReplay } from '../../../../common/domain/PerformReplay';
import { Repository } from '../../../../common/domain/Repository';
declare const processDomainEvent: ({ application, domainEventDispatcher, consumerProgressStore, lockStore, repository, issueCommand, performReplay }: {
    application: Application;
    domainEventDispatcher: DomainEventDispatcher;
    consumerProgressStore: ConsumerProgressStore;
    lockStore: LockStore;
    repository: Repository;
    issueCommand: (parameters: {
        command: CommandWithMetadata<CommandData>;
    }) => void | Promise<void>;
    performReplay: PerformReplay;
}) => Promise<void>;
export { processDomainEvent };
