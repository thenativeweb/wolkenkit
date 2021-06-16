import { Application } from '../../../../common/application/Application';
import { GraphQLFieldConfig } from 'graphql';
import { Notification } from '../../../../common/elements/Notification';
import { ResolverContext } from '../ResolverContext';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
declare const getSubscriptionSchema: ({ application, subscriber, channelForNotifications }: {
    application: Application;
    subscriber: Subscriber<Notification>;
    channelForNotifications: string;
}) => Promise<GraphQLFieldConfig<any, ResolverContext>>;
export { getSubscriptionSchema };
