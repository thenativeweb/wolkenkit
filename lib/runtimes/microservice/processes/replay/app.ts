#!/usr/bin/env node

import { AeonstoreDomainEventStore } from '../../../../stores/domainEventStore/Aeonstore';
import { configurationDefinition } from './configurationDefinition';
import { Client as DomainEventDispatcherClient } from '../../../../apis/handleDomainEvent/http/v2/Client';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import { getPerformReplay } from './getPerformReplay';
import http from 'http';
import { loadApplication } from '../../../../common/application/loadApplication';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = fromEnvironmentVariables({ configurationDefinition });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await AeonstoreDomainEventStore.create({
      protocol: configuration.aeonstoreProtocol,
      hostName: configuration.aeonstoreHostName,
      port: configuration.aeonstorePort
    });

    const domainEventDispatcherClient = new DomainEventDispatcherClient({
      protocol: configuration.domainEventDispatcherProtocol,
      hostName: configuration.domainEventDispatcherHostName,
      port: configuration.domainEventDispatcherPort,
      path: '/handle-domain-event/v2'
    });

    const performReplay = getPerformReplay({
      domainEventStore,
      domainEventDispatcherClient
    });

    const { api } = await getApi({
      configuration,
      application,
      performReplay
    });

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info(
        'Replay server started.',
        { port: configuration.port, healthPort: configuration.healthPort }
      );
    });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
