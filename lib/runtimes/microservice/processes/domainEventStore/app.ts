#!/usr/bin/env node

import { configurationDefinition } from './configurationDefinition';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import http from 'http';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    logger.info(
      'Starting domain event store server...',
      withLogMetadata('runtime', 'microservice/domainEventStore')
    );

    const domainEventStore = await createDomainEventStore(configuration.domainEventStoreOptions);

    const { api } = await getApi({
      configuration,
      domainEventStore
    });

    await runHealthServer({
      corsOrigin: configuration.healthCorsOrigin,
      portOrSocket: configuration.healthPortOrSocket
    });

    const server = http.createServer(api);

    server.listen(configuration.portOrSocket, (): void => {
      logger.info(
        'Started domain event store server.',
        withLogMetadata('runtime', 'microservice/domainEventStore', {
          portOrSocket: configuration.portOrSocket,
          healthPortOrSocket: configuration.healthPortOrSocket
        })
      );
    });
  } catch (ex: unknown) {
    logger.fatal(
      'An unexpected error occured.',
      withLogMetadata('runtime', 'microservice/domainEventStore', { error: ex })
    );
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
