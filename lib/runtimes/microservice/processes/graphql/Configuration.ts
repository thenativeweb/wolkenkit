import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';

export interface Configuration {
  aeonstoreHostName: string;
  aeonstorePort: number;
  aeonstoreProtocol: string;
  applicationDirectory: string;
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  commandDispatcherProtocol: string;
  commandDispatcherRetries: number;
  corsOrigin: string | string[];
  enableIntegratedClient: boolean;
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  pubSubOptions: {
    channelForNewDomainEvents: string;
    channelForNotifications: string;
    publisher: PublisherOptions;
    subscriber: SubscriberOptions;
  };
  snapshotStrategy: SnapshotStrategyConfiguration;
}
