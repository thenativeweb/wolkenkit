import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  applicationDirectory: string;
  enableIntegratedClient: boolean;
  corsOrigin: string | string[];
  commandDispatcherProtocol: string;
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  commandDispatcherRetries: number;
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  healthPort: number;
  subscribeMessagesProtocol: string;
  subscribeMessagesHostName: string;
  subscribeMessagesPort: number;
  subscribeMessagesChannel: string;
  snapshotStrategy: SnapshotStrategyConfiguration;
}
