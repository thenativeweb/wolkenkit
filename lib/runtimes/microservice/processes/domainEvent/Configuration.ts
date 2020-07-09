import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  applicationDirectory: string;
  domainEventCorsOrigin: string | string[];
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  enableOpenApiDocumentation: boolean;
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  snapshotStrategy: SnapshotStrategyConfiguration;
  subscribeMessagesChannel: string;
  subscribeMessagesHostName: string;
  subscribeMessagesPort: number;
  subscribeMessagesProtocol: string;
}
