#!/usr/bin/env node

import { configurationDefinition } from './configurationDefinition';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import http from 'http';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    const domainEventStore = await createDomainEventStore(configuration.domainEventStoreOptions);

    const { api } = await getApi({
      configuration,
      domainEventStore
    });

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info(
        'Domain event store server started.',
        { port: configuration.port, healthPort: configuration.healthPort }
      );
    });
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
