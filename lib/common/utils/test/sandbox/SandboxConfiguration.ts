import { AggregateIdentifier } from '../../../elements/AggregateIdentifier';
import { Application } from '../../../application/Application';
import { CommandData } from '../../../elements/CommandData';
import { CommandWithMetadata } from '../../../elements/CommandWithMetadata';
import { ConsumerProgressStore } from '../../../../stores/consumerProgressStore/ConsumerProgressStore';
import { ContextIdentifier } from '../../../elements/ContextIdentifier';
import { DomainEvent } from '../../../elements/DomainEvent';
import { DomainEventData } from '../../../elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { GetAggregateService } from '../../../services/types/GetAggregateService';
import { GetAggregatesService } from '../../../services/types/GetAggregatesService';
import { GetClientService } from '../../../services/types/GetClientService';
import { GetCommandService } from '../../../services/types/GetCommandService';
import { GetLockService } from '../../../services/types/GetLockService';
import { GetLoggerService } from '../../../services/types/GetLoggerService';
import { LockStore } from '../../../../stores/lockStore/LockStore';
import { SnapshotStrategy } from '../../../domain/SnapshotStrategy';

export interface SandboxConfiguration {
  application: Application;

  domainEventStore?: DomainEventStore;
  flowProgressStore?: ConsumerProgressStore;
  lockStore?: LockStore;
  snapshotStrategy?: SnapshotStrategy;

  aggregateServiceFactory?: GetAggregateService;
  aggregatesServiceFactory?: GetAggregatesService;
  clientServiceFactory?: GetClientService;
  commandServiceFactory?: GetCommandService;
  lockServiceFactory?: GetLockService;
  loggerServiceFactory?: GetLoggerService;
}

export interface SandboxConfigurationForAggregate extends SandboxConfiguration {
  contextIdentifier: ContextIdentifier;
  aggregateIdentifier: AggregateIdentifier;

  domainEvents: DomainEvent<DomainEventData>[];
  commands: CommandWithMetadata<CommandData>[];
}

export interface SandboxConfigurationForFlow extends SandboxConfiguration {
  flowName: string;

  domainEvents: DomainEvent<DomainEventData>[];
}

export interface SandboxConfigurationForView extends SandboxConfiguration {
  viewName: string;
}
