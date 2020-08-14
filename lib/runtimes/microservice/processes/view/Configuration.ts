import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';

export interface Configuration {
  applicationDirectory: string;
  enableOpenApiDocumentation: boolean;
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  pubSubOptions: {
    channelForNotifications: string;
    publisher: PublisherOptions;
    subscriber: SubscriberOptions;
  };
  viewCorsOrigin: string | string[];
}
