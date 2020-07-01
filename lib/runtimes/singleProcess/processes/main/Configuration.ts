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
  priorityQueueStoreForCommandsType: string;
  priorityQueueStoreForCommandsOptions: object & { expirationTime: number };
  priorityQueueStoreForDomainEventsType: string;
  priorityQueueStoreForDomainEventsOptions: object & { expirationTime: number };
  consumerProgressStoreType: string;
  consumerProgressStoreOptions: object;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  healthPort: number;
  snapshotStrategy: SnapshotStrategyConfiguration;
  concurrentCommands: number;
  concurrentFlows: number;
  commandQueueRenewInterval: number;
  enableOpenApiDocumentation: boolean;
}
