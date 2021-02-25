import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { flaschenpost } from 'flaschenpost';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHandleCommandApi } from '../../../../apis/handleCommand/http';
import { getApi as getOpenApiApi } from '../../../../apis/openApi/http';
import { IdentityProvider } from 'limes';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import express, { Application as ExpressApplication } from 'express';

const logger = flaschenpost.getLogger();

const getApi = async function ({
  configuration,
  application,
  identityProviders,
  onReceiveCommand,
  onCancelCommand
}: {
  configuration: Configuration;
  application: Application;
  identityProviders: IdentityProvider[];
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
}): Promise<{ api: ExpressApplication }> {
  const corsOrigin = getCorsOrigin(configuration.commandCorsOrigin);

  const { api: handleCommandApi, getApiDefinitions: getHandleCommandApiDefinitions } = await getHandleCommandApi({
    corsOrigin,
    onReceiveCommand,
    onCancelCommand,
    application,
    identityProviders
  });

  const api = express();

  api.use('/command', handleCommandApi);

  if (configuration.enableOpenApiDocumentation) {
    logger.info(
      'Open api endpoint is enabled.',
      withLogMetadata('runtime', 'microservice/command')
    );

    const { api: openApiApi } = await getOpenApiApi({
      corsOrigin,
      application,
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
