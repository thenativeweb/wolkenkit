import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { getApi as getCommandApi } from '../../../../apis/handleCommand/http';
import { getCorsOrigin } from 'get-cors-origin';
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
}): Promise<Application> {
  const { api: healthApi } = await getHealthApi({
    corsOrigin: getCorsOrigin(environmentVariables.HEALTH_CORS_ORIGIN)
  });

  const { api: commandApi } = await getCommandApi({
    corsOrigin: getCorsOrigin(environmentVariables.COMMAND_CORS_ORIGIN),
    onReceiveCommand,
    applicationDefinition,
    identityProviders
  });

  const api = express();

  api.use('/health', healthApi);
  api.use('/command', commandApi);

  return api;
};

export { getApi };
