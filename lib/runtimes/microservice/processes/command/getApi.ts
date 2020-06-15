import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHandleCommandApi } from '../../../../apis/handleCommand/http';
import { getApi as getOpenApiApi } from '../../../../apis/openApi/http';
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
  const corsOrigin = getCorsOrigin(configuration.commandCorsOrigin);

  const { api: handleCommandApi, getApiDefinitions: getHandleCommandApiDefinitions } = await getHandleCommandApi({
    corsOrigin,
    onReceiveCommand,
    applicationDefinition,
    identityProviders
  });

  const api = express();

  api.use('/command', handleCommandApi);

  if (configuration.enableOpenApiDocumentation) {
    const { api: openApiApi } = await getOpenApiApi({
      corsOrigin,
      applicationDefinition,
      title: 'Command server API',
      schemes: [ 'http' ],
      apis: [
        ...getHandleCommandApiDefinitions('command')
      ]
    });

    api.use('/open-api', openApiApi);
  }

  return { api };
};

export { getApi };
