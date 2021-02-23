import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getDescription } from './getDescription';
import { getNotifications } from './getNotifications';
import { IdentityProvider } from 'limes';
import { Notification } from '../../../../common/elements/Notification';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';

const getV2 = async function ({
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
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: false },
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  const authenticationMiddleware = await getAuthenticationMiddleware({
    identityProviders
  });

  api.get(`/${getDescription.path}`, getDescription.getHandler({
    application
  }));

  api.get(
    `/${getNotifications.path}`,
    authenticationMiddleware,
    getNotifications.getHandler({
      application,
      subscriber,
      channelForNotifications,
      heartbeatInterval
    })
  );

  return { api };
};

export { getV2 };
