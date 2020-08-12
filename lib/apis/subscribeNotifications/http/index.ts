import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { Notification } from '../../../common/elements/Notification';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import express, { Application } from 'express';

const getApi = async function ({ corsOrigin, subscriber, channelForNotifications, heartbeatInterval = 90_000 }: {
  corsOrigin: CorsOrigin;
  subscriber: Subscriber<Notification>;
  channelForNotifications: string;
  heartbeatInterval?: number;
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    subscriber,
    channelForNotifications,
    heartbeatInterval
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
