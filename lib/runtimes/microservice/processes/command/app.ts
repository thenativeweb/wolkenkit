#!/usr/bin/env node

import { Client as CommandDispatcherClient } from '../../../../apis/handleCommandWithMetadata/http/v2/Client';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getConfiguration } from './getConfiguration';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getOnCancelCommand } from './getOnCancelCommand';
import { getOnReceiveCommand } from './getOnReceiveCommand';
import http from 'http';
import { loadApplication } from '../../../../common/application/loadApplication';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = getConfiguration();

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: configuration.identityProviders
    });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const commandDispatcherClient = new CommandDispatcherClient({
      protocol: configuration.commandDispatcherProtocol,
      hostName: configuration.commandDispatcherHostName,
      port: configuration.commandDispatcherPort,
      path: '/handle-command/v2'
    });

    const commandDispatcher = {
      client: commandDispatcherClient,
      retries: configuration.commandDispatcherRetries
    };
    const onReceiveCommand = getOnReceiveCommand({ commandDispatcher });
    const onCancelCommand = getOnCancelCommand({ commandDispatcher });

    const { api } = await getApi({
      configuration,
      application,
      identityProviders,
      onReceiveCommand,
      onCancelCommand
    });

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info(
        'Command server started.',
        { port: configuration.port, healthPort: configuration.healthPort }
      );
    });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
