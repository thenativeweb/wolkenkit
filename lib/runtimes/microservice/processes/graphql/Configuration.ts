import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  applicationDirectory: string;
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  commandDispatcherProtocol: string;
  commandDispatcherRetries: number;
  corsOrigin: string | string[];
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  enableIntegratedClient: boolean;
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  snapshotStrategy: SnapshotStrategyConfiguration;
  subscribeMessagesChannel: string;
  subscribeMessagesHostName: string;
  subscribeMessagesPort: number;
  subscribeMessagesProtocol: string;
}
