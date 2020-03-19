#!/usr/bin/env node

import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getConfiguration } from './getConfiguration';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import http from 'http';
import { InMemoryPriorityQueueStore } from '../../../../stores/priorityQueueStore/InMemory';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import pForever from 'p-forever';
import { processCommand } from './processCommand';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
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

    const domainEventStore = await createDomainEventStore({
      type: configuration.domainEventStoreType,
      options: configuration.domainEventStoreOptions
    });

    const lockStore = await createLockStore({
      type: configuration.lockStoreType,
      options: configuration.lockStoreOptions
    });

    const repository = new Repository({
      applicationDefinition,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy)
    });

    const priorityQueueStore = await InMemoryPriorityQueueStore.create<CommandWithMetadata<CommandData>>({});

    const onReceiveCommand: OnReceiveCommand = async ({ command }): Promise<void> => {
      await priorityQueueStore.enqueue({ item: command });
    };

    const { api, publishDomainEvent, initializeGraphQlOnServer } = await getApi({
      configuration,
      applicationDefinition,
      identityProviders,
      onReceiveCommand,
      repository
    });

    const server = http.createServer(api);

    await initializeGraphQlOnServer?.({ server });

    await runHealthServer({ corsOrigin: configuration.corsOrigin, port: configuration.healthPort });

    server.listen(configuration.port, (): void => {
      logger.info('Single process runtime server started.', { port: configuration.port });
    });

    const publishDomainEvents: PublishDomainEvents = async function ({ domainEvents }): Promise<void> {
      for (const domainEvent of domainEvents) {
        publishDomainEvent({ domainEvent });
      }
    };

    for (let i = 0; i < configuration.concurrentCommands; i++) {
      pForever(async (): Promise<void> => {
        await processCommand({
          applicationDefinition,
          repository,
          lockStore,
          priorityQueue: {
            store: priorityQueueStore,
            renewalInterval: configuration.commandQueueRenewInterval
          },
          publishDomainEvents
        });
      });
    }
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
