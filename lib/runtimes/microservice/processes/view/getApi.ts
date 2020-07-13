import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getOpenApiApi } from '../../../../apis/openApi/http';
import { getApi as getQueryViewApi } from '../../../../apis/queryView/http';
import { IdentityProvider } from 'limes';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({ application, configuration, identityProviders }: {
  application: Application;
  configuration: Configuration;
  identityProviders: IdentityProvider[];
}): Promise<{ api: ExpressApplication }> {
  const corsOrigin = getCorsOrigin(configuration.corsOrigin);

  const { api: queryViewsApi, getApiDefinitions } = await getQueryViewApi({
    corsOrigin,
    application,
    identityProviders
  });

  const api = express();

  api.use('/views', queryViewsApi);

  if (configuration.enableOpenApiDocumentation) {
    const { api: openApiApi } = await getOpenApiApi({
      corsOrigin,
      application,
      title: 'View server API',
      schemes: [ 'http' ],
      apis: [
        ...getApiDefinitions('views')
      ]
    });

    api.use('/open-api', openApiApi);
  }

  return { api };
};

export { getApi };
