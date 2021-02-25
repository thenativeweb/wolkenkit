#!/usr/bin/env node

import { AeonstoreDomainEventStore } from '../../../../stores/domainEventStore/Aeonstore';
import { CommandData } from '../../../../common/elements/CommandData';
import { Client as CommandDispatcherClient } from '../../../../apis/handleCommandWithMetadata/http/v2/Client';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { configurationDefinition } from './configurationDefinition';
import { createConsumerProgressStore } from '../../../../stores/consumerProgressStore/createConsumerProgressStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { Client as DomainEventDispatcherClient } from '../../../../apis/awaitItem/http/v2/Client';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import { loadApplication } from '../../../../common/application/loadApplication';
import { Notification } from '../../../../common/elements/Notification';
import { PerformReplay } from '../../../../common/domain/PerformReplay';
import pForever from 'p-forever';
import { processDomainEvent } from './processDomainEvent';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Client as ReplayClient } from '../../../../apis/performReplay/http/v2/Client';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../shared/runHealthServer';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

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

    const lockStore = await createLockStore(configuration.lockStoreOptions);

    const publisher = await createPublisher<Notification>(configuration.pubSubOptions.publisher);

    const repository = new Repository({
      application,
      lockStore,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy),
      publisher,
      pubSubChannelForNotifications: configuration.pubSubOptions.channelForNotifications
    });

    const consumerProgressStore = await createConsumerProgressStore(configuration.consumerProgressStoreOptions);

    const domainEventDispatcherClient = new DomainEventDispatcherClient<DomainEvent<DomainEventData>>({
      protocol: configuration.domainEventDispatcherProtocol,
      hostName: configuration.domainEventDispatcherHostName,
      portOrSocket: configuration.domainEventDispatcherPortOrSocket,
      path: '/await-domain-event/v2',
      createItemInstance: ({ item }: { item: DomainEvent<DomainEventData> }): DomainEvent<DomainEventData> => new DomainEvent<DomainEventData>(item)
    });

    const commandDispatcherClient = new CommandDispatcherClient({
      protocol: configuration.commandDispatcherProtocol,
      hostName: configuration.commandDispatcherHostName,
      portOrSocket: configuration.commandDispatcherPortOrSocket,
      path: '/handle-command/v2'
    });

    const replayClient = new ReplayClient({
      protocol: configuration.replayServerProtocol,
      hostName: configuration.replayServerHostName,
      portOrSocket: configuration.replayServerPortOrSocket,
      path: '/perform-replay/v2'
    });

    await runHealthServer({
      corsOrigin: configuration.healthCorsOrigin,
      portOrSocket: configuration.healthPortOrSocket
    });

    logger.info(
      'Flow server started.',
      withLogMetadata('runtime', 'microservice/flow', {
        healthPortOrSocket: configuration.healthPortOrSocket
      })
    );

    const issueCommand = async function ({ command }: { command: CommandWithMetadata<CommandData> }): Promise<void> {
      await commandDispatcherClient.postCommand({ command });
    };

    const performReplay: PerformReplay = async function ({
      flowNames,
      aggregates
    }): Promise<void> {
      await replayClient.performReplay({
        flowNames,
        aggregates
      });
    };

    for (let i = 0; i < configuration.concurrentFlows; i++) {
      pForever(async (): Promise<void> => {
        await processDomainEvent({
          application,
          domainEventDispatcher: {
            client: domainEventDispatcherClient,
            renewalInterval: configuration.domainEventDispatcherRenewInterval,
            acknowledgeRetries: configuration.domainEventDispatcherAcknowledgeRetries
          },
          consumerProgressStore,
          lockStore,
          repository,
          issueCommand,
          performReplay
        });
      });
    }
  } catch (ex: unknown) {
    logger.fatal(
      'An unexpected error occured.',
      withLogMetadata('runtime', 'microservice/flow', { error: ex })
    );
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
