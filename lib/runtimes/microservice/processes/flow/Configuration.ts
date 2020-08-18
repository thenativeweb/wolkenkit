import { ConsumerProgressStoreOptions } from '../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { LockStoreOptions } from '../../../../stores/lockStore/LockStoreOptions';
import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
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
  consumerProgressStoreOptions: ConsumerProgressStoreOptions;
  domainEventDispatcherAcknowledgeRetries: number;
  domainEventDispatcherHostName: string;
  domainEventDispatcherPort: number;
  domainEventDispatcherProtocol: string;
  domainEventDispatcherRenewInterval: number;
  healthCorsOrigin: string | string[];
  healthPort: number;
  lockStoreOptions: LockStoreOptions;
  replayServerHostName: string;
  replayServerPort: number;
  replayServerProtocol: string;
  pubSubOptions: {
    channelForNotifications: string;
    publisher: PublisherOptions;
  };
  snapshotStrategy: SnapshotStrategyConfiguration;
}
