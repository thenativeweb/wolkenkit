import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { IdentityProvider } from 'limes';
import { Notification } from '../../../../common/elements/Notification';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ configuration, application, identityProviders, subscriber, channelForNotifications }: {
    configuration: Configuration;
    application: Application;
    identityProviders: IdentityProvider[];
    subscriber: Subscriber<Notification>;
    channelForNotifications: string;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };
