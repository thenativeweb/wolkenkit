import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { getApiBase } from '../../../base/getApiBase';
import { getNotifications } from './getNotifications';
import { Notification } from '../../../../common/elements/Notification';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';

const getV2 = async function ({ corsOrigin, subscriber, channelForNotifications, heartbeatInterval = 90_000 }: {
  corsOrigin: CorsOrigin;
  subscriber: Subscriber<Notification>;
  channelForNotifications: string;
  heartbeatInterval?: number;
}): Promise<{ api: Application }> {
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

  api.get(
    `/${getNotifications.path}`,
    getNotifications.getHandler({
      subscriber,
      channelForNotifications,
      heartbeatInterval
    })
  );

  return { api };
};

export { getV2 };
