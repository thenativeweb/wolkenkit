import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  applicationDirectory: string;
  domainEventDispatcherProtocol: string;
  domainEventDispatcherHostName: string;
  domainEventDispatcherPort: number;
  domainEventDispatcherRenewInterval: number;
  domainEventDispatcherAcknowledgeRetries: number;
  commandDispatcherProtocol: string;
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  replayServerProtocol: string;
  replayServerHostName: string;
  replayServerPort: number;
  aeonstoreProtocol: string;
  aeonstoreHostName: string;
  aeonstorePort: number;
  lockStoreOptions: object;
  lockStoreType: string;
  consumerProgressStoreType: string;
  consumerProgressStoreOptions: object;
  healthCorsOrigin: string | string[];
  healthPort: number;
  concurrentFlows: number;
  snapshotStrategy: SnapshotStrategyConfiguration;
}
