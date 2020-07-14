import { Application } from 'express';
import cors from 'cors';
import { CorsOrigin } from 'get-cors-origin';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getFile } from './getFile';
import { IdentityProvider } from 'limes';
import { postAddFile } from './postAddFile';
import { postRemoveFile } from './postRemoveFile';

const getV2 = async function ({ corsOrigin, identityProviders, fileStore }: {
  corsOrigin: CorsOrigin;
  identityProviders: IdentityProvider[];
  fileStore: FileStore;
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: false },
      body: { parser: false },
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  const authenticationMiddleware = await getAuthenticationMiddleware({ identityProviders });

  api.use(cors({
    origin: corsOrigin,
    allowedHeaders: [ 'content-type', 'x-metadata' ],
    exposedHeaders: [ 'content-length', 'content-type', 'content-disposition', 'x-metadata' ]
  }));

  api.get(`/${getFile.path}`, authenticationMiddleware, getFile.getHandler({ fileStore }));
  api.post(`/${postAddFile.path}`, authenticationMiddleware, postAddFile.getHandler({ fileStore }));
  api.post(`/${postRemoveFile.path}`, authenticationMiddleware, postRemoveFile.getHandler({ fileStore }));

  return { api };
};

export { getV2 };
