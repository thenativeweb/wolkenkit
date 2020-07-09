import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  aeonstoreHostName: string;
  aeonstorePort: number;
  aeonstoreProtocol: string;
  applicationDirectory: string;
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  commandDispatcherProtocol: string;
  concurrentFlows: number;
  consumerProgressStoreOptions: object;
  consumerProgressStoreType: string;
  domainEventDispatcherAcknowledgeRetries: number;
  domainEventDispatcherHostName: string;
  domainEventDispatcherPort: number;
  domainEventDispatcherProtocol: string;
  domainEventDispatcherRenewInterval: number;
  healthCorsOrigin: string | string[];
  healthPort: number;
  lockStoreOptions: object;
  lockStoreType: string;
  replayServerHostName: string;
  replayServerPort: number;
  replayServerProtocol: string;
  snapshotStrategy: SnapshotStrategyConfiguration;
}
