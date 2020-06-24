import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  applicationDirectory: string;
  commandDispatcherProtocol: string;
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  commandDispatcherRenewInterval: number;
  commandDispatcherAcknowledgeRetries: number;
  publisherProtocol: string;
  publisherHostName: string;
  publisherPort: number;
  aeonstoreProtocol: string;
  aeonstoreHostName: string;
  aeonstorePort: number;
  lockStoreOptions: object;
  lockStoreType: string;
  healthCorsOrigin: string | string[];
  healthPort: number;
  concurrentCommands: number;
  snapshotStrategy: SnapshotStrategyConfiguration;
}
