import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getQueryViewApi } from '../../../../apis/queryView/http';
import { IdentityProvider } from 'limes';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({ application, configuration, identityProviders }: {
  application: Application;
  configuration: Configuration;
  identityProviders: IdentityProvider[];
}): Promise<{ api: ExpressApplication }> {
  const corsOrigin = getCorsOrigin(configuration.corsOrigin);

  const { api: queryViewsApi } = await getQueryViewApi({
    corsOrigin,
    application,
    identityProviders
  });

  const api = express();

  api.use('/views', queryViewsApi);

  return { api };
};

export { getApi };
