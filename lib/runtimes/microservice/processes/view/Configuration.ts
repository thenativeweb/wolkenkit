import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';

export interface Configuration {
  applicationDirectory: string;
  enableOpenApiDocumentation: boolean;
  healthCorsOrigin: string | string[];
  healthPortOrSocket: number;
  identityProviders: { issuer: string; certificate: string }[];
  portOrSocket: number;
  pubSubOptions: {
    channelForNotifications: string;
    publisher: PublisherOptions;
    subscriber: SubscriberOptions;
  };
  viewCorsOrigin: string | string[];
}
