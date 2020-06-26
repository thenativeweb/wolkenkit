#!/usr/bin/env node

import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { createPriorityQueueStore } from '../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { doesItemIdentifierWithClientMatchCommandWithMetadata } from '../../../../common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getConfiguration } from './getConfiguration';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import http from 'http';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../common/application/loadApplication';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
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

    const application = await loadApplication({
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
      application,
      lockStore,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy)
    });

    const priorityQueueStore = await createPriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>({
      type: configuration.priorityQueueStoreType,
      doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata,
      options: configuration.priorityQueueStoreOptions
    });

    const onReceiveCommand: OnReceiveCommand = async ({ command }): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: command,
        discriminator: command.aggregateIdentifier.id,
        priority: command.metadata.timestamp
      });
    };
    const onCancelCommand: OnCancelCommand = async ({ commandIdentifierWithClient }): Promise<void> => {
      await priorityQueueStore.remove({
        discriminator: commandIdentifierWithClient.aggregateIdentifier.id,
        itemIdentifier: commandIdentifierWithClient
      });
    };

    const { api, publishDomainEvent, initializeGraphQlOnServer } = await getApi({
      configuration,
      application,
      identityProviders,
      onReceiveCommand,
      onCancelCommand,
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
          application,
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
