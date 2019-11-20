import { Application } from 'express';
import cors from 'cors';
import { CorsOrigin } from 'get-cors-origin';
import { FileStore } from '../../../stores/fileStore/FileStore';
import { getApiBase } from '../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../base/getAuthenticationMiddleware';
import { IdentityProvider } from 'limes';
import { SpecificAuthorizationOption } from './v2/isAuthorized/AuthorizationOptions';
import * as v2 from './v2';

const getApi = async function ({
  corsOrigin,
  addFileAuthorizationOptions,
  identityProviders,
  fileStore
}: {
  corsOrigin: CorsOrigin;
  addFileAuthorizationOptions: SpecificAuthorizationOption;
  identityProviders: IdentityProvider[];
  fileStore: FileStore;
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: false },
      body: { parser: false }
    },
    response: {
      headers: { cache: false }
    }
  });

  const authenticationMiddleware = await getAuthenticationMiddleware({ identityProviders });

  api.use(cors({
    origin: corsOrigin,
    allowedHeaders: [ 'content-type', 'authorization', 'x-metadata', 'x-to' ],
    exposedHeaders: [ 'content-length', 'content-type', 'content-disposition', 'x-metadata' ]
  }));

  api.get('/file/:id', authenticationMiddleware, v2.getFile({ fileStore }));
  api.post('/add-file', authenticationMiddleware, v2.postAddFile({ addFileAuthorizationOptions, fileStore }));
  api.post('/remove-file', authenticationMiddleware, v2.postRemoveFile({ fileStore }));
  api.post('/transfer-ownership', authenticationMiddleware, v2.postTransferOwnership({ fileStore }));
  api.post('/authorize', authenticationMiddleware, v2.postAuthorize({ fileStore }));

  return { api };
};

export { getApi };
