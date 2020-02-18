import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHandleCommandApi } from '../../../../apis/handleCommand/http';
import { IdentityProvider } from 'limes';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import express, { Application } from 'express';

const getApi = async function ({
  configuration,
  applicationDefinition,
  identityProviders,
  onReceiveCommand
}: {
  configuration: Configuration;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
  onReceiveCommand: OnReceiveCommand;
}): Promise<{ api: Application }> {
  const { api: handleCommandApi } = await getHandleCommandApi({
    corsOrigin: getCorsOrigin(configuration.commandCorsOrigin),
    onReceiveCommand,
    applicationDefinition,
    identityProviders
  });

  const api = express();

  api.use('/command', handleCommandApi);

  return { api };
};

export { getApi };
