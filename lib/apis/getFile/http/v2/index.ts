import { Application } from 'express';
import cors from 'cors';
import { CorsOrigin } from 'get-cors-origin';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getFile } from './getFile';
import { IdentityProvider } from 'limes';
import { postAddFile } from './postAddFile';
import { postAuthorize } from './postAuthorize';
import { postRemoveFile } from './postRemoveFile';
import { postTransferOwnership } from './postTransferOwnership';
import { SpecificAuthorizationOption } from './isAuthorized/AuthorizationOptions';

const getV2 = async function ({
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

  api.get('/file/:id', authenticationMiddleware, getFile({ fileStore }));
  api.post('/add-file', authenticationMiddleware, postAddFile({ addFileAuthorizationOptions, fileStore }));
  api.post('/remove-file', authenticationMiddleware, postRemoveFile({ fileStore }));
  api.post('/transfer-ownership', authenticationMiddleware, postTransferOwnership({ fileStore }));
  api.post('/authorize', authenticationMiddleware, postAuthorize({ fileStore }));

  return { api };
};

export { getV2 };
