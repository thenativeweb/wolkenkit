import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';

export interface Configuration {
  aeonstoreHostName: string;
  aeonstorePort: number;
  aeonstoreProtocol: string;
  applicationDirectory: string;
  domainEventCorsOrigin: string | string[];
  enableOpenApiDocumentation: boolean;
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  pubSubChannelForNotifications: string;
  publisherOptions: PublisherOptions;
  snapshotStrategy: SnapshotStrategyConfiguration;
  subscribeMessagesChannel: string;
  subscribeMessagesHostName: string;
  subscribeMessagesPort: number;
  subscribeMessagesProtocol: string;
}
