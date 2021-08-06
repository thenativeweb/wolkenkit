import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getLandingPageApi } from '../../../../apis/landingPage/http';
import { getApi as getPerformReplayApi } from '../../../../apis/performReplay/http';
import { PerformReplay } from '../../../../common/domain/PerformReplay';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({ configuration, application, performReplay }: {
  configuration: Configuration;
  application: Application;
  performReplay: PerformReplay;
}): Promise<{ api: ExpressApplication }> {
  const corsOrigin = getCorsOrigin(configuration.corsOrigin);

  const { api: landingPageApi } = await getLandingPageApi();
  const { api: performReplayApi } = await getPerformReplayApi({
    corsOrigin,
    performReplay,
    application
  });

  const api = express();

  api.use(landingPageApi);
  api.use('/perform-replay', performReplayApi);

  return { api };
};

export { getApi };
