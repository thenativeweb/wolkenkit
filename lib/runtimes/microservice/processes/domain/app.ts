#!/usr/bin/env node

import { AeonstoreDomainEventStore } from '../../../../stores/domainEventStore/Aeonstore';
import { CommandData } from '../../../../common/elements/CommandData';
import { Client as CommandDispatcherClient } from '../../../../apis/awaitItem/http/v2/Client';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { configurationDefinition } from './configurationDefinition';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { Client as DomainEventDispatcherClient } from '../../../../apis/handleDomainEvent/http/v2/Client';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import { loadApplication } from '../../../../common/application/loadApplication';
import { Notification } from '../../../../common/elements/Notification';
import pForever from 'p-forever';
import { processCommand } from './processCommand';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { Client as PublisherClient } from '../../../../apis/publishMessage/http/v2/Client';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../shared/runHealthServer';
import { State } from '../../../../common/elements/State';

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

    const lockStore = await createLockStore(configuration.lockStoreOptions);

    const publisher = await createPublisher<Notification>(configuration.publisherOptions);

    const repository = new Repository({
      application,
      lockStore,
      domainEventStore,
      publisher,
      publisherChannelForNotifications: configuration.publisherChannelForNotifications,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy)
    });

    const commandDispatcherClient = new CommandDispatcherClient<CommandWithMetadata<CommandData>>({
      protocol: configuration.commandDispatcherProtocol,
      hostName: configuration.commandDispatcherHostName,
      port: configuration.commandDispatcherPort,
      path: '/await-command/v2',
      createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
    });

    const publisherClient = new PublisherClient({
      protocol: configuration.publisherProtocol,
      hostName: configuration.publisherHostName,
      port: configuration.publisherPort,
      path: '/publish/v2/'
    });

    const domainEventDispatcherClient = new DomainEventDispatcherClient({
      protocol: configuration.domainEventDispatcherProtocol,
      hostName: configuration.domainEventDispatcherHostName,
      port: configuration.domainEventDispatcherPort,
      path: '/handle-domain-event/v2'
    });

    const publishDomainEvents: PublishDomainEvents = async ({ domainEvents }: {
      domainEvents: DomainEventWithState<DomainEventData, State>[];
    }): Promise<any> => {
      for (const domainEvent of domainEvents) {
        await publisherClient.postMessage({
          channel: configuration.publisherChannelNewDomainEvent,
          message: domainEvent
        });
        await domainEventDispatcherClient.postDomainEvent({
          domainEvent: domainEvent.withoutState()
        });
      }
    };

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    logger.info('Domain server started.', { healthPort: configuration.healthPort });

    for (let i = 0; i < configuration.concurrentCommands; i++) {
      pForever(async (): Promise<void> => {
        await processCommand({
          commandDispatcher: {
            client: commandDispatcherClient,
            renewalInterval: configuration.commandDispatcherRenewInterval,
            acknowledgeRetries: configuration.commandDispatcherAcknowledgeRetries
          },
          repository,
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
