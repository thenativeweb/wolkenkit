import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { IdentityProvider } from 'limes';
import { Notification } from '../../../common/elements/Notification';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ application, corsOrigin, identityProviders, subscriber, channelForNotifications, heartbeatInterval }: {
    application: Application;
    corsOrigin: CorsOrigin;
    identityProviders: IdentityProvider[];
    subscriber: Subscriber<Notification>;
    channelForNotifications: string;
    heartbeatInterval: number;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };
