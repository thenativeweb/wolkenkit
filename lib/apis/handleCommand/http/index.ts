import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { OnReceiveCommand } from '../OnReceiveCommand';
import express, { Application } from 'express';

const getApi = async function ({
  corsOrigin,
  onReceiveCommand,
  applicationDefinition,
  identityProviders
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    onReceiveCommand,
    applicationDefinition,
    identityProviders
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
