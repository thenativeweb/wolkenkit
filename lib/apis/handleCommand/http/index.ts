import { Application } from 'express';
import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { getApiBase } from '../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../base/getAuthenticationMiddleware';
import { IdentityProvider } from 'limes';
import { OnReceiveCommand } from '../OnReceiveCommand';
import * as v2 from './v2';

const getApi = async function ({
  corsOrigin,
  onReceiveCommand,
  applicationDefinition,
  identityProviders
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }}
    },
    response: {
      headers: { cache: false }
    }
  });

  const authenticationMiddleware = await getAuthenticationMiddleware({
    identityProviders
  });

  api.get('/v2/description', v2.getDescription({
    applicationDefinition
  }));

  api.post('/v2/', authenticationMiddleware, v2.postCommand({
    onReceiveCommand,
    applicationDefinition
  }));

  return { api };
};

export { getApi };
