import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import express, { Application } from 'express';

const getApi = async function ({ corsOrigin }: {
  corsOrigin: CorsOrigin;
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
