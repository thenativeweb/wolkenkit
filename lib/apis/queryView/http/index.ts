import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getApiDefinitions } from './getApiDefinitions';
import { getV2 } from './v2';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function<TItem> ({ corsOrigin, application }: {
  corsOrigin: CorsOrigin;
  application: Application;
}): Promise<{ api: ExpressApplication; getApiDefinitions: (basePath: string) => ApiDefinition[] }> {
  const api = express();

  const v2 = await getV2<TItem>({
    corsOrigin,
    application
  });

  api.use('/v2', v2.api);

  return {
    api,
    getApiDefinitions: (basePath: string): ApiDefinition[] => getApiDefinitions({ application, basePath })
  };
};

export { getApi };
