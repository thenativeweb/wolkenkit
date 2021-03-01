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
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../shared/runHealthServer';
import { State } from '../../../../common/elements/State';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    logger.info(
      'Starting domain server...',
      withLogMetadata('runtime', 'microservice/domain')
    );

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await AeonstoreDomainEventStore.create({
      protocol: configuration.aeonstoreProtocol,
      hostName: configuration.aeonstoreHostName,
      portOrSocket: configuration.aeonstorePortOrSocket
    });

    const lockStore = await createLockStore(configuration.lockStoreOptions);

    const publisher = await createPublisher<Notification | DomainEventWithState<DomainEventData, State>>(
      configuration.pubSubOptions.publisher
    );

    const repository = new Repository({
      application,
      lockStore,
      domainEventStore,
      publisher,
      pubSubChannelForNotifications: configuration.pubSubOptions.channelForNotifications,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy)
    });

    const commandDispatcherClient = new CommandDispatcherClient<CommandWithMetadata<CommandData>>({
      protocol: configuration.commandDispatcherProtocol,
      hostName: configuration.commandDispatcherHostName,
      portOrSocket: configuration.commandDispatcherPortOrSocket,
      path: '/await-command/v2',
      createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
    });

    const domainEventDispatcherClient = new DomainEventDispatcherClient({
      protocol: configuration.domainEventDispatcherProtocol,
      hostName: configuration.domainEventDispatcherHostName,
      portOrSocket: configuration.domainEventDispatcherPortOrSocket,
      path: '/handle-domain-event/v2'
    });

    const publishDomainEvents: PublishDomainEvents = async ({ domainEvents }: {
      domainEvents: DomainEventWithState<DomainEventData, State>[];
    }): Promise<any> => {
      logger.debug(
        'Publishing domain events...',
        withLogMetadata('runtime', 'microservice/domain', { domainEvents })
      );

      for (const domainEvent of domainEvents) {
        await publisher.publish({
          channel: configuration.pubSubOptions.channelForNewDomainEvents,
          message: domainEvent
        });
        await domainEventDispatcherClient.postDomainEvent({
          domainEvent: domainEvent.withoutState()
        });
      }

      logger.debug(
        'Published domain events.',
        withLogMetadata('runtime', 'microservice/domain', { domainEvents })
      );
    };

    await runHealthServer({
      corsOrigin: configuration.healthCorsOrigin,
      portOrSocket: configuration.healthPortOrSocket
    });

    logger.info(
      'Started domain server.',
      withLogMetadata(
        'runtime',
        'microservice/domain',
        { healthPortOrSocket: configuration.healthPortOrSocket }
      )
    );

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

      logger.debug(
        'Started command process loop.',
        withLogMetadata('runtime', 'microservice/domain', { loopIndex: i })
      );
    }
  } catch (ex: unknown) {
    logger.fatal(
      'An unexpected error occured.',
      withLogMetadata('runtime', 'microservice/domain', { error: ex })
    );
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
