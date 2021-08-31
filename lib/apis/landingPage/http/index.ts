import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../base/getApiBase';
import { getMiddleware as getLoggingMiddleware } from 'flaschenpost';
import { landingPage } from './landingPage';

const getApi = async function (): Promise<{ api: ExpressApplication }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: []}},
      body: { parser: false },
      query: { parser: { useJson: false }}
    },
    response: {
      headers: { cache: false }
    }
  });

  const loggingMiddleware = getLoggingMiddleware();

  api.get(
    `/${landingPage.path}`,
    loggingMiddleware,
    await landingPage.getHandler()
  );

  return { api };
};

export {
  getApi
};
