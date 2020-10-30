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
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
import { doesItemIdentifierWithClientMatchCommandWithMetadata } from '../../../../common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata';
import { doesItemIdentifierWithClientMatchDomainEvent } from '../../../../common/domain/doesItemIdentifierWithClientMatchDomainEvent';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { executeNotificationSubscribers } from '../../../../common/domain/executeNotificationSubscribers';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getLoggerService } from '../../../../common/services/getLoggerService';
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

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: configuration.identityProviders
    });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await createDomainEventStore(configuration.domainEventStoreOptions);

    const lockStore = await createLockStore(configuration.lockStoreOptions);

    const publisher = await createPublisher<Notification>(configuration.pubSubOptions.publisher);
    const subscriber = await createSubscriber<Notification>(configuration.pubSubOptions.subscriber);

    const repository = new Repository({
      application,
      lockStore,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy),
      publisher,
      pubSubChannelForNotifications: configuration.pubSubOptions.channelForNotifications
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
      fileStore,
      subscriber,
      channelForNotifications: configuration.pubSubOptions.channelForNotifications
    });

    const server = http.createServer(api);

    await initializeGraphQlOnServer?.({ server });

    await runHealthServer({ corsOrigin: configuration.corsOrigin, port: configuration.healthPort });

    server.listen(configuration.port, (): void => {
      logger.info('Single process runtime server started.', { port: configuration.port });
    });

    await subscriber.subscribe({
      channel: configuration.pubSubOptions.channelForNotifications,
      async callback (notification: Notification): Promise<void> {
        const notifications: Notification[] = [];

        for (const viewName of Object.keys(application.views)) {
          await executeNotificationSubscribers({
            application,
            viewName,
            notification,
            services: {
              logger: getLoggerService({
                packageManifest: application.packageManifest,
                fileName: `<app>/server/views/${viewName}`
              }),
              notification: {
                publish (name, data, metadata): void {
                  notifications.push({ name, data, metadata });
                }
              }
            }
          });
        }

        for (const newNotification of notifications) {
          await publisher.publish({
            channel: configuration.pubSubOptions.channelForNotifications,
            message: newNotification
          });
        }
      }
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
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
