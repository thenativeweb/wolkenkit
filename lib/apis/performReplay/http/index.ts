import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { OnPerformReplay } from '../OnPerformReplay';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  corsOrigin,
  onPerformReplay,
  application
}: {
  corsOrigin: CorsOrigin;
  onPerformReplay: OnPerformReplay;
  application: Application;
}): Promise<{ api: ExpressApplication }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    onPerformReplay,
    application
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
