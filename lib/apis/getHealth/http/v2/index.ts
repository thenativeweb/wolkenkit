import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { getApiBase } from '../../../base/getApiBase';
import { getHealth } from './getHealth';

const getV2 = async function ({ corsOrigin }: {
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

  api.get('/', getHealth());

  return { api };
};

export { getV2 };
