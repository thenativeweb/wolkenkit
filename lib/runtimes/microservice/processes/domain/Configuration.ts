import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  aeonstoreHostName: string;
  aeonstorePort: number;
  aeonstoreProtocol: string;
  applicationDirectory: string;
  commandDispatcherAcknowledgeRetries: number;
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  commandDispatcherProtocol: string;
  commandDispatcherRenewInterval: number;
  concurrentCommands: number;
  domainEventDispatcherHostName: string;
  domainEventDispatcherPort: number;
  domainEventDispatcherProtocol: string;
  healthCorsOrigin: string | string[];
  healthPort: number;
  lockStoreOptions: Record<string, any>;
  lockStoreType: string;
  publisherChannelNewDomainEvent: string;
  publisherHostName: string;
  publisherPort: number;
  publisherProtocol: string;
  snapshotStrategy: SnapshotStrategyConfiguration;
}
