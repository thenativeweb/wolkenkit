import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  corsOrigin,
  onReceiveCommand,
  onCancelCommand,
  application
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  application: Application;
}): Promise<{ api: ExpressApplication }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    onReceiveCommand,
    onCancelCommand,
    application
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
