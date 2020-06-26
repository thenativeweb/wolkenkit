import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getApiDefinitions } from './getApiDefinitions';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  corsOrigin,
  onReceiveCommand,
  onCancelCommand,
  application,
  identityProviders
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  application: Application;
  identityProviders: IdentityProvider[];
}): Promise<{ api: ExpressApplication; getApiDefinitions: (basePath: string) => ApiDefinition[] }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    onReceiveCommand,
    onCancelCommand,
    application,
    identityProviders
  });

  api.use('/v2', v2.api);

  return {
    api,
    getApiDefinitions: (basePath: string): ApiDefinition[] => getApiDefinitions({ application, basePath })
  };
};

export { getApi };
