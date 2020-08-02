import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { ConsumerProgressStoreOptions } from '../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { DistributiveOmit } from '../../../../common/types/DistributiveOmit';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStoreOptions } from '../../../../stores/domainEventStore/DomainEventStoreOptions';
import { FileStoreOptions } from '../../../../stores/fileStore/FileStoreOptions';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { LockStoreOptions } from '../../../../stores/lockStore/LockStoreOptions';
import { PriorityQueueStoreOptions } from '../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  applicationDirectory: string;
  commandQueueRenewInterval: number;
  concurrentCommands: number;
  concurrentFlows: number;
  consumerProgressStoreOptions: ConsumerProgressStoreOptions;
  corsOrigin: string | string[];
  domainEventStoreOptions: DomainEventStoreOptions;
  enableOpenApiDocumentation: boolean;
  fileStoreOptions: FileStoreOptions;
  graphqlApi: false | { enableIntegratedClient: boolean };
  healthPort: number;
  httpApi: boolean;
  identityProviders: { issuer: string; certificate: string }[];
  lockStoreOptions: LockStoreOptions;
  port: number;
  priorityQueueStoreForCommandsOptions: DistributiveOmit<PriorityQueueStoreOptions<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'>;
  priorityQueueStoreForDomainEventsOptions: DistributiveOmit<PriorityQueueStoreOptions<DomainEvent<DomainEventData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'>;
  snapshotStrategy: SnapshotStrategyConfiguration;
}
