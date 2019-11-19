import { Application } from 'express';
import { CorsOrigin } from '../../base/CorsOrigin';
import { getApiBase } from '../../base/getApiBase';
import * as v2 from './v2';

const getApi = async function ({ corsOrigin }: {
  corsOrigin: CorsOrigin;
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: false }
    },
    response: {
      headers: { cache: false }
    }
  });

  api.get('/v2/', v2.getHealth());

  return { api };
};

export { getApi };
