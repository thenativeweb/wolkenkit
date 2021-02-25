import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { Notification } from '../../../common/elements/Notification';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  application,
  corsOrigin,
  identityProviders,
  subscriber,
  channelForNotifications,
  heartbeatInterval
}: {
  application: Application;
  corsOrigin: CorsOrigin;
  identityProviders: IdentityProvider[];
  subscriber: Subscriber<Notification>;
  channelForNotifications: string;
  heartbeatInterval: number;
}): Promise<{ api: ExpressApplication }> {
  const api = express();

  const v2 = await getV2({
    application,
    corsOrigin,
    identityProviders,
    subscriber,
    channelForNotifications,
    heartbeatInterval
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
