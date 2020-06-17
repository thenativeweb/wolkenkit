import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { AggregateInstance } from './AggregateInstance';
import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { DomainEventStore } from '../../stores/domainEventStore/DomainEventStore';
import { GetAggregateService } from '../services/types/GetAggregateService';
import { GetAggregatesService } from '../services/types/GetAggregatesService';
import { GetClientService } from '../services/types/GetClientService';
import { GetLockService } from '../services/types/GetLockService';
import { GetLoggerService } from '../services/types/GetLoggerService';
import { LockStore } from '../../stores/lockStore/LockStore';
import { SnapshotStrategy } from './SnapshotStrategy';
import { State } from '../elements/State';

class Repository {
  public readonly applicationDefinition: ApplicationDefinition;

  public readonly domainEventStore: DomainEventStore;

  public readonly lockStore: LockStore;

  public readonly snapshotStrategy: SnapshotStrategy;

  public readonly serviceFactories?: {
    getAggregateService?: GetAggregateService;
    getAggregatesService?: GetAggregatesService;
    getClientService?: GetClientService;
    getLockService?: GetLockService;
    getLoggerService?: GetLoggerService;
  };

  public constructor ({
    applicationDefinition,
    domainEventStore,
    lockStore,
    snapshotStrategy,
    serviceFactories
  }: {
    applicationDefinition: ApplicationDefinition;
    domainEventStore: DomainEventStore;
    lockStore: LockStore;
    snapshotStrategy: SnapshotStrategy;
    serviceFactories?: {
      getAggregateService?: GetAggregateService;
      getAggregatesService?: GetAggregatesService;
      getClientService?: GetClientService;
      getLockService?: GetLockService;
      getLoggerService?: GetLoggerService;
    };
  }) {
    this.applicationDefinition = applicationDefinition;
    this.domainEventStore = domainEventStore;
    this.lockStore = lockStore;
    this.snapshotStrategy = snapshotStrategy;
    this.serviceFactories = serviceFactories;
  }

  public async getAggregateInstance <TState extends State> ({ contextIdentifier, aggregateIdentifier }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<AggregateInstance<TState>> {
    return await AggregateInstance.create({
      applicationDefinition: this.applicationDefinition,
      contextIdentifier,
      aggregateIdentifier,
      lockStore: this.lockStore,
      domainEventStore: this.domainEventStore,
      snapshotStrategy: this.snapshotStrategy,
      serviceFactories: this.serviceFactories,
      repository: this
    });
  }
}

export { Repository };
