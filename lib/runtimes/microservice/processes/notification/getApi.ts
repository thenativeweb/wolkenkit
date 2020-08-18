import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getSubscribeNotificationsApi } from '../../../../apis/subscribeNotifications/http';
import { IdentityProvider } from 'limes';
import { Notification } from '../../../../common/elements/Notification';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  configuration,
  application,
  identityProviders,
  subscriber,
  channelForNotifications
}: {
  configuration: Configuration;
  application: Application;
  identityProviders: IdentityProvider[];
  subscriber: Subscriber<Notification>;
  channelForNotifications: string;
}): Promise<{ api: ExpressApplication }> {
  const corsOrigin = getCorsOrigin(configuration.notificationCorsOrigin);

  const api = express();

  const { api: subscribeNotificationsApi } = await getSubscribeNotificationsApi({
    application,
    identityProviders,
    subscriber,
    channelForNotifications,
    corsOrigin
  });

  api.use('/notifications', subscribeNotificationsApi);

  return { api };
};

export { getApi };
