import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import express, { Application } from 'express';

const getApi = async function ({
  corsOrigin,
  onReceiveCommand,
  onCancelCommand,
  applicationDefinition
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  applicationDefinition: ApplicationDefinition;
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    onReceiveCommand,
    onCancelCommand,
    applicationDefinition
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
