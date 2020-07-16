import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getFile } from './getFile';
import { IdentityProvider } from 'limes';
import { postAddFile } from './postAddFile';
import { postRemoveFile } from './postRemoveFile';

const getV2 = async function ({ application, corsOrigin, identityProviders, fileStore }: {
  application: Application;
  corsOrigin: CorsOrigin;
  identityProviders: IdentityProvider[];
  fileStore: FileStore;
}): Promise<{ api: ExpressApplication }> {
  const api = await getApiBase({
    request: {
      headers: {
        cors: {
          origin: corsOrigin,
          allowedHeaders: [ 'content-type', 'x-id', 'x-name' ],
          exposedHeaders: [ 'content-length', 'content-type', 'content-disposition' ]
        }
      },
      body: { parser: false },
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  const authenticationMiddleware = await getAuthenticationMiddleware({ identityProviders });

  api.get(`/${getFile.path}`,
    authenticationMiddleware,
    getFile.getHandler({ fileStore }));

  api.post(`/${postAddFile.path}`,
    authenticationMiddleware,
    postAddFile.getHandler({ application, fileStore }));

  api.post(`/${postRemoveFile.path}`,
    authenticationMiddleware,
    postRemoveFile.getHandler({ fileStore }));

  return { api };
};

export { getV2 };
