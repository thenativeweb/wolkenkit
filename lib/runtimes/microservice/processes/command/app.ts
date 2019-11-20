#!/usr/bin/env node

import express from 'express';
import { flaschenpost } from 'flaschenpost';
import fs from 'fs';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getApi as getCommandApi } from '../../../../apis/handleCommand/http';
import { getCorsOrigin } from 'get-cors-origin';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getHandleReceivedCommand } from './getHandleReceivedCommand';
import { getApi as getHealthApi } from '../../../../apis/getHealth/http';
import http from 'http';
import { IdentityProvider } from 'limes';
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

    const dispatcherServer = {
      hostName: environmentVariables.DISPATCHER_SERVER_HOSTNAME,
      port: environmentVariables.DISPATCHER_SERVER_PORT,
      retries: environmentVariables.DISPATCHER_SERVER_RETRIES
    };

    const identityProviders = await Promise.all(
      environmentVariables.IDENTITY_PROVIDERS.
        map(async (identityProvider): Promise<IdentityProvider> => {
          const certificate = await fs.promises.readFile(path.join(identityProvider.certificate, 'certificate.pem'));

          return new IdentityProvider({
            issuer: identityProvider.issuer,
            certificate
          });
        })
    );

    const applicationDefinition = await getApplicationDefinition({
      applicationDirectory: environmentVariables.APPLICATION_DIRECTORY
    });

    const handleReceivedCommand = getHandleReceivedCommand({ dispatcherServer });

    const commandHttp = await getCommandApi({
      corsOrigin: getCorsOrigin(environmentVariables.COMMAND_CORS_ORIGIN),
      onReceiveCommand: handleReceivedCommand,
      applicationDefinition,
      identityProviders
    });

    const healthHttp = await getHealthApi({
      corsOrigin: getCorsOrigin(environmentVariables.HEALTH_CORS_ORIGIN)
    });

    const api = express();

    api.use('/command', commandHttp.api);
    api.use('/health', healthHttp.api);

    const server = http.createServer(api);

    await new Promise((resolve, reject): void => {
      try {
        server.listen(environmentVariables.PORT, resolve);
      } catch (ex) {
        reject(ex);
      }
    });

    logger.info('Command server started.', { port: environmentVariables.PORT });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
