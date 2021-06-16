import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { Application } from '../application/Application';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventStore } from '../../stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { GetAggregateService } from '../services/types/GetAggregateService';
import { GetAggregatesService } from '../services/types/GetAggregatesService';
import { GetClientService } from '../services/types/GetClientService';
import { GetLockService } from '../services/types/GetLockService';
import { GetLoggerService } from '../services/types/GetLoggerService';
import { GetNotificationService } from '../services/types/GetNotificationService';
import { LockStore } from '../../stores/lockStore/LockStore';
import { Notification } from '../elements/Notification';
import { Publisher } from '../../messaging/pubSub/Publisher';
import { Repository } from './Repository';
import { Snapshot } from '../../stores/domainEventStore/Snapshot';
import { SnapshotStrategy } from './SnapshotStrategy';
import { State } from '../elements/State';
declare class AggregateInstance<TState extends State> {
    readonly application: Application;
    readonly aggregateIdentifier: AggregateIdentifier;
    state: TState;
    revision: number;
    unstoredDomainEvents: DomainEventWithState<DomainEventData, TState>[];
    readonly domainEventStore: DomainEventStore;
    readonly lockStore: LockStore;
    readonly snapshotStrategy: SnapshotStrategy;
    readonly publisher: Publisher<Notification>;
    readonly pubSubChannelForNotifications: string;
    protected serviceFactories: {
        getAggregateService: GetAggregateService;
        getAggregatesService: GetAggregatesService;
        getClientService: GetClientService;
        getLockService: GetLockService;
        getLoggerService: GetLoggerService;
        getNotificationService?: GetNotificationService;
    };
    protected repository: Repository;
    protected constructor({ application, aggregateIdentifier, initialState, domainEventStore, lockStore, publisher, pubSubChannelForNotifications, serviceFactories, snapshotStrategy, repository }: {
        application: Application;
        aggregateIdentifier: AggregateIdentifier;
        initialState: TState;
        domainEventStore: DomainEventStore;
        lockStore: LockStore;
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
        snapshotStrategy: SnapshotStrategy;
        repository: Repository;
    });
    static create<TCreateState extends State>({ application, aggregateIdentifier, domainEventStore, lockStore, snapshotStrategy, publisher, pubSubChannelForNotifications, serviceFactories, repository }: {
        application: Application;
        aggregateIdentifier: AggregateIdentifier;
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
        repository: Repository;
    }): Promise<AggregateInstance<TCreateState>>;
    storeCurrentAggregateState(): Promise<void>;
    handleCommand({ command }: {
        command: CommandWithMetadata<CommandData>;
    }): Promise<DomainEventWithState<DomainEventData, TState>[]>;
    isPristine(): boolean;
    applySnapshot({ snapshot }: {
        snapshot: Snapshot<TState>;
    }): void;
    applyDomainEvent<TDomainEventData extends DomainEventData>({ application, domainEvent }: {
        application: Application;
        domainEvent: DomainEvent<TDomainEventData>;
    }): TState;
}
export { AggregateInstance };
