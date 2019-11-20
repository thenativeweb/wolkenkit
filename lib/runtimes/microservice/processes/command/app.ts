#!/usr/bin/env node

import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getIdentityProviders } from './getIdentityProviders';
import { getOnReceiveCommand } from './getOnReceiveCommand';
import http from 'http';
import path from 'path';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const environmentVariables = getEnvironmentVariables({
      APPLICATION_DIRECTORY: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
      COMMAND_CORS_ORIGIN: '*',
      DISPATCHER_SERVER_HOSTNAME: 'dispatcher',
      DISPATCHER_SERVER_PORT: 3000,
      DISPATCHER_SERVER_RETRIES: 5,
      HEALTH_CORS_ORIGIN: '*',
      IDENTITY_PROVIDERS: [{
        issuer: 'https://token.invalid',
        certificate: path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
      }],
      PORT: 3000
    });

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: environmentVariables.IDENTITY_PROVIDERS
    });

    const applicationDefinition = await getApplicationDefinition({
      applicationDirectory: environmentVariables.APPLICATION_DIRECTORY
    });

    const onReceiveCommand = getOnReceiveCommand({
      dispatcher: {
        hostName: environmentVariables.DISPATCHER_SERVER_HOSTNAME,
        port: environmentVariables.DISPATCHER_SERVER_PORT,
        retries: environmentVariables.DISPATCHER_SERVER_RETRIES
      }
    });

    const api = await getApi({
      environmentVariables,
      applicationDefinition,
      identityProviders,
      onReceiveCommand
    });

    const server = http.createServer(api);

    server.listen(environmentVariables.PORT, (): void => {
      logger.info('Command server started.', { port: environmentVariables.PORT });
    });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
