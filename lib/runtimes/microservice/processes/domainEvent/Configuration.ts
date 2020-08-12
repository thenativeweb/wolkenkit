import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';

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
  pubSubOptions: {
    channelForNewDomainEvent: string;
    channelForNotification: string;
    publisher: PublisherOptions;
    subscriber: SubscriberOptions;
  };
  snapshotStrategy: SnapshotStrategyConfiguration;
}
