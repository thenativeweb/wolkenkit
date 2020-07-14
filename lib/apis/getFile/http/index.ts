import { CorsOrigin } from 'get-cors-origin';
import { FileStore } from '../../../stores/fileStore/FileStore';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import express, { Application } from 'express';

const getApi = async function ({ corsOrigin, identityProviders, fileStore }: {
  corsOrigin: CorsOrigin;
  identityProviders: IdentityProvider[];
  fileStore: FileStore;
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({ corsOrigin, identityProviders, fileStore });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };
