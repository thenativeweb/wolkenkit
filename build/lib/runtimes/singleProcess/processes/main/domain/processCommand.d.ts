import { Application } from '../../../../../common/application/Application';
import { DomainPriorityQueue } from './DomainPriorityQueue';
import { LockStore } from '../../../../../stores/lockStore/LockStore';
import { PublishDomainEvents } from '../../../../../common/domain/PublishDomainEvents';
import { Repository } from '../../../../../common/domain/Repository';
declare const processCommand: ({ repository, priorityQueue, publishDomainEvents }: {
    application: Application;
    repository: Repository;
    lockStore: LockStore;
    priorityQueue: DomainPriorityQueue;
    publishDomainEvents: PublishDomainEvents;
}) => Promise<void>;
export { processCommand };
