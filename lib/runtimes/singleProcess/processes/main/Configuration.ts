import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  applicationDirectory: string;
  commandQueueRenewInterval: number;
  concurrentCommands: number;
  concurrentFlows: number;
  consumerProgressStoreOptions: Record<string, any>;
  consumerProgressStoreType: string;
  corsOrigin: string | string[];
  domainEventStoreOptions: Record<string, any>;
  domainEventStoreType: string;
  enableOpenApiDocumentation: boolean;
  fileStoreType: string;
  fileStoreOptions: Record<string, any>;
  graphqlApi: false | { enableIntegratedClient: boolean };
  healthPort: number;
  httpApi: boolean;
  identityProviders: { issuer: string; certificate: string }[];
  lockStoreOptions: Record<string, any>;
  lockStoreType: string;
  port: number;
  priorityQueueStoreForCommandsOptions: Record<string, any> & { expirationTime: number };
  priorityQueueStoreForCommandsType: string;
  priorityQueueStoreForDomainEventsOptions: Record<string, any> & { expirationTime: number };
  priorityQueueStoreForDomainEventsType: string;
  snapshotStrategy: SnapshotStrategyConfiguration;
}
