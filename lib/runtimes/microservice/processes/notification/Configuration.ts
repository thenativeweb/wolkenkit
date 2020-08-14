import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';

export interface Configuration {
  applicationDirectory: string;
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  notificationCorsOrigin: string | string[];
  port: number;
  pubSubOptions: {
    channelForNotifications: string;
    subscriber: SubscriberOptions;
  };
}
