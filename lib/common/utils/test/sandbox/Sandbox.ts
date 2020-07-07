import { AggregateIdentifier } from '../../../elements/AggregateIdentifier';
import { Application } from '../../../application/Application';
import { ConsumerProgressStore } from '../../../../stores/consumerProgressStore/ConsumerProgressStore';
import { ContextIdentifier } from '../../../elements/ContextIdentifier';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { GetAggregateService } from '../../../services/types/GetAggregateService';
import { GetAggregatesService } from '../../../services/types/GetAggregatesService';
import { GetClientService } from '../../../services/types/GetClientService';
import { GetCommandService } from '../../../services/types/GetCommandService';
import { GetLockService } from '../../../services/types/GetLockService';
import { GetLoggerService } from '../../../services/types/GetLoggerService';
import { LockStore } from '../../../../stores/lockStore/LockStore';
import { SandboxForAggregate } from './SandboxForAggregate';
import { SandboxForFlow } from './SandboxForFlow';
import { SnapshotStrategy } from '../../../domain/SnapshotStrategy';
import { State } from '../../../elements/State';

export interface UninitializedSandbox {
  withApplication({ application }: {
    application: Application;
  }): Sandbox;
}

export interface Sandbox {
  withDomainEventStore({ domainEventStore }: {
    domainEventStore: DomainEventStore;
  }): Sandbox;

  withFlowProgressStore(parameters: {
    flowProgressStore: ConsumerProgressStore;
  }): Sandbox;

  withLockStore({ lockStore }: {
    lockStore: LockStore;
  }): Sandbox;

  withSnapshotStrategy({ snapshotStrategy }: {
    snapshotStrategy: SnapshotStrategy;
  }): Sandbox;

  withAggregateServiceFactory({ aggregateServiceFactory }: {
    aggregateServiceFactory: GetAggregateService;
  }): Sandbox;

  withAggregatesServiceFactory({ aggregatesServiceFactory }: {
    aggregatesServiceFactory: GetAggregatesService;
  }): Sandbox;

  withClientServiceFactory({ clientServiceFactory }: {
    clientServiceFactory: GetClientService;
  }): Sandbox;

  withCommandServiceFactory(parameters: {
    commandServiceFactory: GetCommandService;
  }): Sandbox;

  withLockServiceFactory({ lockServiceFactory }: {
    lockServiceFactory: GetLockService;
  }): Sandbox;

  withLoggerServiceFactory({ loggerServiceFactory }: {
    loggerServiceFactory: GetLoggerService;
  }): Sandbox;

  forAggregate<TState extends State>({ contextIdentifier, aggregateIdentifier }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
  }): SandboxForAggregate<TState>;

  forFlow(parameters: {
    flowName: string;
  }): SandboxForFlow;
}
