import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';

export interface Configuration {
  healthCorsOrigin: string | string[];
  healthPort: number;
  port: number;
  publishCorsOrigin: string | string[];
  pubSubOptions: {
    publisher: PublisherOptions;
    subscriber: SubscriberOptions;
  };
  subscribeCorsOrigin: string | string[];
}
