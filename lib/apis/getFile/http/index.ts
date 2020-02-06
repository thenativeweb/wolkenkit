import { CorsOrigin } from 'get-cors-origin';
import { FileStore } from '../../../stores/fileStore/FileStore';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { SpecificAuthorizationOption } from './v2/isAuthorized/AuthorizationOptions';
import express, { Application } from 'express';

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
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    addFileAuthorizationOptions,
    identityProviders,
    fileStore
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
