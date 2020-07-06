import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { PerformReplay } from '../../PerformReplay';
import { postPerformReplay } from './postPerformReplay';

const getV2 = async function ({ corsOrigin, performReplay, application }: {
  corsOrigin: CorsOrigin;
  performReplay: PerformReplay;
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

  api.post(`/${postPerformReplay.path}`, postPerformReplay.getHandler({
    performReplay,
    application
  }));

  return { api };
};

export { getV2 };
