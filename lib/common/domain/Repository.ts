import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { AggregateInstance } from './AggregateInstance';
import { Application } from '../application/Application';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { DomainEventStore } from '../../stores/domainEventStore/DomainEventStore';
import { GetAggregateService } from '../services/types/GetAggregateService';
import { GetAggregatesService } from '../services/types/GetAggregatesService';
import { GetClientService } from '../services/types/GetClientService';
import { GetLockService } from '../services/types/GetLockService';
import { GetLoggerService } from '../services/types/GetLoggerService';
import { GetNotificationService } from '../services/types/GetNotificationService';
import { LockStore } from '../../stores/lockStore/LockStore';
import { SnapshotStrategy } from './SnapshotStrategy';
import { State } from '../elements/State';
import { Publisher } from '../../messaging/pubSub/Publisher';
import { Notification } from '../elements/Notification';

class Repository {
  public readonly application: Application;

  public readonly domainEventStore: DomainEventStore;

  public readonly lockStore: LockStore;

  public readonly snapshotStrategy: SnapshotStrategy;

  public readonly publisher: Publisher<Notification>;

  public readonly pubSubChannelForNotifications: string;

  public readonly serviceFactories?: {
    getAggregateService?: GetAggregateService;
    getAggregatesService?: GetAggregatesService;
    getClientService?: GetClientService;
    getLockService?: GetLockService;
    getLoggerService?: GetLoggerService;
    getNotificationService?: GetNotificationService;
  };

  public constructor ({
    application,
    domainEventStore,
    lockStore,
    snapshotStrategy,
    publisher,
    pubSubChannelForNotifications,
    serviceFactories
  }: {
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
  }) {
    this.application = application;
    this.domainEventStore = domainEventStore;
    this.lockStore = lockStore;
    this.snapshotStrategy = snapshotStrategy;
    this.publisher = publisher;
    this.pubSubChannelForNotifications = pubSubChannelForNotifications;
    this.serviceFactories = serviceFactories;
  }

  public async getAggregateInstance <TState extends State> ({ contextIdentifier, aggregateIdentifier }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<AggregateInstance<TState>> {
    return await AggregateInstance.create({
      application: this.application,
      contextIdentifier,
      aggregateIdentifier,
      lockStore: this.lockStore,
      domainEventStore: this.domainEventStore,
      snapshotStrategy: this.snapshotStrategy,
      publisher: this.publisher,
      pubSubChannelForNotifications: this.pubSubChannelForNotifications,
      serviceFactories: this.serviceFactories,
      repository: this
    });
  }
}

export { Repository };
