import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { AggregateInstance } from './AggregateInstance';
import { Application } from '../application/Application';
import { DomainEventStore } from '../../stores/domainEventStore/DomainEventStore';
import { GetAggregateService } from '../services/types/GetAggregateService';
import { GetAggregatesService } from '../services/types/GetAggregatesService';
import { GetClientService } from '../services/types/GetClientService';
import { GetLockService } from '../services/types/GetLockService';
import { GetLoggerService } from '../services/types/GetLoggerService';
import { GetNotificationService } from '../services/types/GetNotificationService';
import { LockStore } from '../../stores/lockStore/LockStore';
import { Notification } from '../elements/Notification';
import { Publisher } from '../../messaging/pubSub/Publisher';
import { SnapshotStrategy } from './SnapshotStrategy';
import { State } from '../elements/State';
declare class Repository {
    readonly application: Application;
    readonly domainEventStore: DomainEventStore;
    readonly lockStore: LockStore;
    readonly snapshotStrategy: SnapshotStrategy;
    readonly publisher: Publisher<Notification>;
    readonly pubSubChannelForNotifications: string;
    readonly serviceFactories?: {
        getAggregateService?: GetAggregateService;
        getAggregatesService?: GetAggregatesService;
        getClientService?: GetClientService;
        getLockService?: GetLockService;
        getLoggerService?: GetLoggerService;
        getNotificationService?: GetNotificationService;
    };
    constructor({ application, domainEventStore, lockStore, snapshotStrategy, publisher, pubSubChannelForNotifications, serviceFactories }: {
        application: Application;
        domainEventStore: DomainEventStore;
        lockStore: LockStore;
        snapshotStrategy: SnapshotStrategy;
        publisher: Publisher<Notification>;
        pubSubChannelForNotifications: string;
        serviceFactories?: {
            getAggregateService?: GetAggregateService;
            getAggregatesService?: GetAggregatesService;
            getClientService?: GetClientService;
            getLockService?: GetLockService;
            getLoggerService?: GetLoggerService;
            getNotificationService?: GetNotificationService;
        };
    });
    getAggregateInstance<TState extends State>({ aggregateIdentifier }: {
        aggregateIdentifier: AggregateIdentifier;
    }): Promise<AggregateInstance<TState>>;
}
export { Repository };
