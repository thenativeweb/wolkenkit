import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { OnReceiveMessage } from '../OnReceiveMessage';
import express, { Application } from 'express';

const getApi = async function ({ corsOrigin, onReceiveMessage }: {
  corsOrigin: CorsOrigin;
  onReceiveMessage: OnReceiveMessage;
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    onReceiveMessage
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
