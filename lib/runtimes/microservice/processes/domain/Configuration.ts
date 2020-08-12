import { LockStoreOptions } from '../../../../stores/lockStore/LockStoreOptions';
import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  aeonstoreHostName: string;
  aeonstorePort: number;
  aeonstoreProtocol: string;
  applicationDirectory: string;
  commandDispatcherAcknowledgeRetries: number;
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  commandDispatcherProtocol: string;
  commandDispatcherRenewInterval: number;
  concurrentCommands: number;
  domainEventDispatcherHostName: string;
  domainEventDispatcherPort: number;
  domainEventDispatcherProtocol: string;
  healthCorsOrigin: string | string[];
  healthPort: number;
  lockStoreOptions: LockStoreOptions;
  pubSubOptions: {
    channelForNewDomainEvent: string;
    channelForNotification: string;
    publisher: PublisherOptions;
  };
  snapshotStrategy: SnapshotStrategyConfiguration;
}
