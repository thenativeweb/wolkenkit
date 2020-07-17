import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getManageFileApi } from '../../../../apis/manageFile/http';
import { getApi as getOpenApiApi } from '../../../../apis/openApi/http';
import { IdentityProvider } from 'limes';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  configuration,
  application,
  identityProviders,
  fileStore
}: {
  configuration: Configuration;
  application: Application;
  identityProviders: IdentityProvider[];
  fileStore: FileStore;
}): Promise<{ api: ExpressApplication }> {
  const corsOrigin = getCorsOrigin(configuration.fileCorsOrigin);

  const { api: manageFileApi, getApiDefinitions: getManageFileApiDefinitions } = await getManageFileApi({
    corsOrigin,
    application,
    identityProviders,
    fileStore
  });

  const api = express();

  api.use('/files', manageFileApi);

  if (configuration.enableOpenApiDocumentation) {
    const { api: openApiApi } = await getOpenApiApi({
      corsOrigin,
      application,
      title: 'File server API',
      schemes: [ 'http' ],
      apis: [
        ...getManageFileApiDefinitions('files')
      ]
    });

    api.use('/open-api', openApiApi);
  }

  return { api };
};

export { getApi };
