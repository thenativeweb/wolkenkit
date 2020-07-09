import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  applicationDirectory: string;
  commandQueueRenewInterval: number;
  concurrentCommands: number;
  concurrentFlows: number;
  consumerProgressStoreOptions: object;
  consumerProgressStoreType: string;
  corsOrigin: string | string[];
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  enableOpenApiDocumentation: boolean;
  graphqlApi: false | { enableIntegratedClient: boolean };
  healthPort: number;
  httpApi: boolean;
  identityProviders: { issuer: string; certificate: string }[];
  lockStoreOptions: object;
  lockStoreType: string;
  port: number;
  priorityQueueStoreForCommandsOptions: object & { expirationTime: number };
  priorityQueueStoreForCommandsType: string;
  priorityQueueStoreForDomainEventsOptions: object & { expirationTime: number };
  priorityQueueStoreForDomainEventsType: string;
  snapshotStrategy: SnapshotStrategyConfiguration;
}
