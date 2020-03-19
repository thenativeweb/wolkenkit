import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  applicationDirectory: string;
  httpApi: boolean;
  graphqlApi: false | { enableIntegratedClient: boolean };
  corsOrigin: string | string[];
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  lockStoreOptions: object;
  lockStoreType: string;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  healthPort: number;
  snapshotStrategy: SnapshotStrategyConfiguration;
  concurrentCommands: number;
  commandQueueRenewInterval: number;
}
