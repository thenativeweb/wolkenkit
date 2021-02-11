import { Application } from '../../../../common/application/Application';
import { cancelCommand } from './cancelCommand';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getDescription } from './getDescription';
import { getMiddleware as getLoggingMiddleware } from 'flaschenpost';
import { IdentityProvider } from 'limes';
import { OnCancelCommand } from '../../OnCancelCommand';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { postCommand } from './postCommand';
import { postCommandWithoutAggregateId } from './postCommandWithoutAggregateId';

const getV2 = async function ({
  corsOrigin,
  onReceiveCommand,
  onCancelCommand,
  application,
  identityProviders
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  application: Application;
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

  api.use(getLoggingMiddleware());

  const authenticationMiddleware = await getAuthenticationMiddleware({
    identityProviders
  });

  api.get(`/${getDescription.path}`, getDescription.getHandler({
    application
  }));

  api.post(`/${postCommand.path}`, authenticationMiddleware, postCommand.getHandler({
    onReceiveCommand,
    application
  }));

  api.post(`/${postCommandWithoutAggregateId.path}`, authenticationMiddleware, postCommandWithoutAggregateId.getHandler({
    onReceiveCommand,
    application
  }));

  api.post(`/${cancelCommand.path}`, authenticationMiddleware, cancelCommand.getHandler({
    onCancelCommand,
    application
  }));

  return { api };
};

export { getV2 };
