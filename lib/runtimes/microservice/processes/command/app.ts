#!/usr/bin/env node

import { Client as DispatcherClient } from '../../../../apis/handleCommandWithMetadata/http/v2/Client';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getConfiguration } from './getConfiguration';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getOnReceiveCommand } from './getOnReceiveCommand';
import http from 'http';
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

    const applicationDefinition = await getApplicationDefinition({
      applicationDirectory: configuration.applicationDirectory
    });

    const dispatcherClient = new DispatcherClient({
      protocol: configuration.dispatcherProtocol,
      hostName: configuration.dispatcherHostName,
      port: configuration.dispatcherPort,
      path: '/handle-command/v2'
    });

    const onReceiveCommand = getOnReceiveCommand({
      dispatcher: {
        client: dispatcherClient,
        retries: configuration.dispatcherRetries
      }
    });

    const { api } = await getApi({
      configuration,
      applicationDefinition,
      identityProviders,
      onReceiveCommand
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
