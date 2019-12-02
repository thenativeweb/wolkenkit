#!/usr/bin/env node

import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getConfiguration } from './getConfiguration';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getOnReceiveCommand } from './getOnReceiveCommand';
import http from 'http';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';

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

    const onReceiveCommand = getOnReceiveCommand({
      dispatcher: {
        hostName: configuration.dispatcherHostName,
        port: configuration.dispatcherPort,
        retries: configuration.dispatcherRetries
      }
    });

    const { api } = await getApi({
      configuration,
      applicationDefinition,
      identityProviders,
      onReceiveCommand
    });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info('Command server started.', { port: configuration.port });
    });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
