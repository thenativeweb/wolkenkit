import { ApiDefinition } from '../../openApi/ApiDefinition';
import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { getApiDefinitions } from './getApiDefinitions';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import express, { Application } from 'express';

const getApi = async function ({
  corsOrigin,
  onReceiveCommand,
  onCancelCommand,
  applicationDefinition,
  identityProviders
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
}): Promise<{ api: Application; getApiDefinitions: (basePath: string) => ApiDefinition[] }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    onReceiveCommand,
    onCancelCommand,
    applicationDefinition,
    identityProviders
  });

  api.use('/v2', v2.api);

  return {
    api,
    getApiDefinitions: (basePath: string): ApiDefinition[] => getApiDefinitions({ applicationDefinition, basePath })
  };
};

export { getApi };
