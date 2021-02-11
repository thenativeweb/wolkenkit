import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getDescription } from './getDescription';
import { IdentityProvider } from 'limes';
import { queryStream } from './queryStream';
import { queryValue } from './queryValue';
import { getMiddleware as getLoggingMiddleware } from 'flaschenpost/build/lib/middleware/getMiddleware';

const getV2 = async function ({ application, corsOrigin, identityProviders }: {
  application: Application;
  corsOrigin: CorsOrigin;
  identityProviders: IdentityProvider[];
}): Promise<{ api: ExpressApplication }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }},
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  const loggingOnResponseMiddleware = getLoggingMiddleware();
  const loggingOnRequestMiddleware = getLoggingMiddleware({ logOn: 'request' });

  const authenticationMiddleware = await getAuthenticationMiddleware({
    identityProviders
  });

  api.get(
    `/${getDescription.path}`,
    loggingOnResponseMiddleware,
    getDescription.getHandler({
      application
    })
  );

  api.get(
    `/${queryStream.path}`,
    loggingOnRequestMiddleware,
    authenticationMiddleware,
    queryStream.getHandler({
      application
    })
  );

  api.get(
    `/${queryValue.path}`,
    loggingOnResponseMiddleware,
    authenticationMiddleware,
    queryValue.getHandler({
      application
    })
  );

  return { api };
};

export { getV2 };
