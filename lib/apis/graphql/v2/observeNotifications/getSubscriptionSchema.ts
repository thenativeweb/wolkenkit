import { Application } from '../../../../common/application/Application';
import { getNotificationsFieldConfiguration } from './getNotificationsFieldConfiguration';
import { GraphQLFieldConfig } from 'graphql';
import { Notification } from '../../../../common/elements/Notification';
import { ResolverContext } from '../ResolverContext';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';

const getSubscriptionSchema = async function ({ application, subscriber, channelForNotifications }: {
  application: Application;
  subscriber: Subscriber<Notification>;
  channelForNotifications: string;
}): Promise<GraphQLFieldConfig<any, ResolverContext>> {
  const notificationEmitter = new SpecializedEventEmitter<Notification>();

  await subscriber.subscribe({
    channel: channelForNotifications,
    callback (notification): void {
      notificationEmitter.emit(notification);
    }
  });

  return getNotificationsFieldConfiguration({
    application,
    notificationEmitter
  });
};

export { getSubscriptionSchema };
