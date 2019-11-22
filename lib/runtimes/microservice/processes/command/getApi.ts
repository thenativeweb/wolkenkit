import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHandleCommandApi } from '../../../../apis/handleCommand/http';
import { getApi as getHealthApi } from '../../../../apis/getHealth/http';
import { IdentityProvider } from 'limes';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import express, { Application } from 'express';

const getApi = async function ({
  environmentVariables,
  applicationDefinition,
  identityProviders,
  onReceiveCommand
}: {
  environmentVariables: Record<string, any>;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
  onReceiveCommand: OnReceiveCommand;
}): Promise<{ api: Application }> {
  const { api: healthApi } = await getHealthApi({
    corsOrigin: getCorsOrigin(environmentVariables.HEALTH_CORS_ORIGIN)
  });

  const { api: handleCommandApi } = await getHandleCommandApi({
    corsOrigin: getCorsOrigin(environmentVariables.COMMAND_CORS_ORIGIN),
    onReceiveCommand,
    applicationDefinition,
    identityProviders
  });

  const api = express();

  api.use('/health', healthApi);
  api.use('/command', handleCommandApi);

  return { api };
};

export { getApi };
