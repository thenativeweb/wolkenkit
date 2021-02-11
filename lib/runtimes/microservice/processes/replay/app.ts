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

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await AeonstoreDomainEventStore.create({
      protocol: configuration.aeonstoreProtocol,
      hostName: configuration.aeonstoreHostName,
      portOrSocket: configuration.aeonstorePortOrSocket
    });

    const domainEventDispatcherClient = new DomainEventDispatcherClient({
      protocol: configuration.domainEventDispatcherProtocol,
      hostName: configuration.domainEventDispatcherHostName,
      portOrSocket: configuration.domainEventDispatcherPortOrSocket,
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

    await runHealthServer({
      corsOrigin: configuration.healthCorsOrigin,
      portOrSocket: configuration.healthPortOrSocket
    });

    const server = http.createServer(api);

    server.listen(configuration.portOrSocket, (): void => {
      logger.info('Replay server started.', {
        portOrSocket: configuration.portOrSocket,
        healthPortOrSocket: configuration.healthPortOrSocket
      });
    });
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { err: ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
