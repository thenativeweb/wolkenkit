#!/usr/bin/env node

import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { configurationDefinition } from './configurationDefinition';
import { createConsumerProgressStore } from '../../../../stores/consumerProgressStore/createConsumerProgressStore';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { createFileStore } from '../../../../stores/fileStore/createFileStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { createPriorityQueueStore } from '../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { doesItemIdentifierWithClientMatchCommandWithMetadata } from '../../../../common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata';
import { doesItemIdentifierWithClientMatchDomainEvent } from '../../../../common/domain/doesItemIdentifierWithClientMatchDomainEvent';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import http from 'http';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../common/application/loadApplication';
import { Notification } from '../../../../common/elements/Notification';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import pForever from 'p-forever';
import { processCommand } from './domain/processCommand';
import { processDomainEvent } from './flow/processDomainEvent';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../shared/runHealthServer';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = fromEnvironmentVariables({ configurationDefinition });

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: configuration.identityProviders
    });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await createDomainEventStore(configuration.domainEventStoreOptions);

    const lockStore = await createLockStore(configuration.lockStoreOptions);

    const publisher = await createPublisher<Notification>(configuration.publisherOptions);

    const repository = new Repository({
      application,
      lockStore,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy),
      publisher,
      publisherChannelForNotifications: configuration.publisherChannelForNotifications
    });

    const consumerProgressStore = await createConsumerProgressStore(configuration.consumerProgressStoreOptions);

    const priorityQueueStoreForCommands = await createPriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>({
      ...configuration.priorityQueueStoreForCommandsOptions,
      doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata
    });
    const priorityQueueStoreForDomainEvents = await createPriorityQueueStore<DomainEvent<DomainEventData>, ItemIdentifierWithClient>({
      ...configuration.priorityQueueStoreForDomainEventsOptions,
      doesIdentifierMatchItem: doesItemIdentifierWithClientMatchDomainEvent
    });

    const onReceiveCommand: OnReceiveCommand = async function ({ command }): Promise<void> {
      await priorityQueueStoreForCommands.enqueue({
        item: command,
        discriminator: command.aggregateIdentifier.id,
        priority: command.metadata.timestamp
      });
    };
    const onCancelCommand: OnCancelCommand = async function ({ commandIdentifierWithClient }): Promise<void> {
      await priorityQueueStoreForCommands.remove({
        discriminator: commandIdentifierWithClient.aggregateIdentifier.id,
        itemIdentifier: commandIdentifierWithClient
      });
    };

    const issueCommand = async function ({ command }: { command: CommandWithMetadata<CommandData> }): Promise<void> {
      await priorityQueueStoreForCommands.enqueue({
        item: command,
        discriminator: command.aggregateIdentifier.id,
        priority: command.metadata.timestamp
      });
    };

    const fileStore = await createFileStore(configuration.fileStoreOptions);

    const { api, publishDomainEvent, initializeGraphQlOnServer } = await getApi({
      configuration,
      application,
      identityProviders,
      onReceiveCommand,
      onCancelCommand,
      repository,
      fileStore
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

        for (const flowName of Object.keys(application.flows)) {
          await priorityQueueStoreForDomainEvents.enqueue({
            item: domainEvent.withoutState(),
            discriminator: flowName,
            priority: domainEvent.metadata.timestamp
          });
        }
      }
    };

    const requestReplay = async function ({ flowName, aggregateIdentifier, from, to }: {
      flowName: string;
      aggregateIdentifier: AggregateIdentifier;
      from: number;
      to: number;
    }): Promise<void> {
      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId: aggregateIdentifier.id,
        fromRevision: from,
        toRevision: to
      });

      for await (const domainEvent of domainEventStream) {
        await priorityQueueStoreForDomainEvents.enqueue({
          item: domainEvent,
          discriminator: flowName,
          priority: (domainEvent as DomainEvent<DomainEventData>).metadata.timestamp
        });
      }
    };

    for (let i = 0; i < configuration.concurrentCommands; i++) {
      pForever(async (): Promise<void> => {
        await processCommand({
          application,
          repository,
          lockStore,
          priorityQueue: {
            store: priorityQueueStoreForCommands,
            renewalInterval: configuration.commandQueueRenewInterval
          },
          publishDomainEvents
        });
      });
    }

    for (let i = 0; i < configuration.concurrentFlows; i++) {
      pForever(async (): Promise<void> => {
        await processDomainEvent({
          application,
          repository,
          lockStore,
          priorityQueue: {
            store: priorityQueueStoreForDomainEvents,
            renewalInterval: configuration.commandQueueRenewInterval
          },
          consumerProgressStore,
          issueCommand,
          requestReplay
        });
      });
    }
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
