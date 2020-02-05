import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { PublishMessage } from '../PublishMessage';
import express, { Application } from 'express';

const getApi = async function ({ corsOrigin, heartbeatInterval = 90_000 }: {
  corsOrigin: CorsOrigin;
  heartbeatInterval?: number;
}): Promise<{ api: Application; publishMessage: PublishMessage }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    heartbeatInterval
  });

  api.use('/v2', v2.api);

  const publishMessage: PublishMessage = function ({ message }): void {
    v2.publishMessage({ message });
  };

  return { api, publishMessage };
};

export { getApi };
