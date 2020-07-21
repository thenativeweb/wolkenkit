import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { FileStore } from '../../../stores/fileStore/FileStore';
import { getApiDefinitions } from './getApiDefinitions';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({ application, corsOrigin, identityProviders, fileStore }: {
  application: Application;
  corsOrigin: CorsOrigin;
  identityProviders: IdentityProvider[];
  fileStore: FileStore;
}): Promise<{ api: ExpressApplication; getApiDefinitions: (basePath: string) => ApiDefinition[] }> {
  const api = express();

  const v2 = await getV2({ application, corsOrigin, identityProviders, fileStore });

  api.use('/v2', v2.api);

  return {
    api,
    getApiDefinitions: (basePath: string): ApiDefinition[] => getApiDefinitions({ basePath })
  };
};

export { getApi };
