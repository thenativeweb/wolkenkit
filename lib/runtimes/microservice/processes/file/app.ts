#!/usr/bin/env node

import { configurationDefinition } from './configurationDefinition';
import { createFileStore } from '../../../../stores/fileStore/createFileStore';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import http from 'http';
import { loadApplication } from '../../../../common/application/loadApplication';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: configuration.identityProviders
    });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const fileStore = await createFileStore(configuration.fileStoreOptions);

    const { api } = await getApi({
      configuration,
      application,
      identityProviders,
      fileStore
    });

    await runHealthServer({
      corsOrigin: configuration.healthCorsOrigin,
      portOrSocket: configuration.healthPortOrSocket
    });

    const server = http.createServer(api);

    server.listen(configuration.portOrSocket, (): void => {
      logger.info(
        'File server started.',
        withLogMetadata('runtime', 'microservice/file', {
          portOrSocket: configuration.portOrSocket,
          healthPortOrSocket: configuration.healthPortOrSocket
        })
      );
    });
  } catch (ex: unknown) {
    logger.fatal(
      'An unexpected error occured.',
      withLogMetadata('runtime', 'microservice/file', { error: ex })
    );
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
