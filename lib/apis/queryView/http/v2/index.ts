import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { query } from './query';

const getV2 = async function<TItem> ({ corsOrigin, application }: {
  corsOrigin: CorsOrigin;
  application: Application;
}): Promise<{ api: ExpressApplication }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }},
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.get(query.path, query.getHandler({
    application
  }));

  return { api };
};

export { getV2 };
