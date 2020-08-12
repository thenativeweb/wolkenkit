#!/usr/bin/env node

import { AeonstoreDomainEventStore } from '../../../../stores/domainEventStore/Aeonstore';
import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { CommandData } from '../../../../common/elements/CommandData';
import { Client as CommandDispatcherClient } from '../../../../apis/handleCommandWithMetadata/http/v2/Client';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { configurationDefinition } from './configurationDefinition';
import { ContextIdentifier } from '../../../../common/elements/ContextIdentifier';
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
import pForever from 'p-forever';
import { processDomainEvent } from './processDomainEvent';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Client as ReplayClient } from '../../../../apis/performReplay/http/v2/Client';
import { Repository } from '../../../../common/domain/Repository';
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

    const lockStore = await createLockStore(configuration.lockStoreOptions);

    const publisher = await createPublisher<Notification>(configuration.pubSubOptions.publisher);

    const repository = new Repository({
      application,
      lockStore,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy),
      publisher,
      pubSubChannelForNotifications: configuration.pubSubOptions.channelForNotification
    });

    const consumerProgressStore = await createConsumerProgressStore(configuration.consumerProgressStoreOptions);

    const domainEventDispatcherClient = new DomainEventDispatcherClient<DomainEvent<DomainEventData>>({
      protocol: configuration.domainEventDispatcherProtocol,
      hostName: configuration.domainEventDispatcherHostName,
      port: configuration.domainEventDispatcherPort,
      path: '/await-domain-event/v2',
      createItemInstance: ({ item }: { item: DomainEvent<DomainEventData> }): DomainEvent<DomainEventData> => new DomainEvent<DomainEventData>(item)
    });

    const commandDispatcherClient = new CommandDispatcherClient({
      protocol: configuration.commandDispatcherProtocol,
      hostName: configuration.commandDispatcherHostName,
      port: configuration.commandDispatcherPort,
      path: '/handle-command/v2'
    });

    const replayClient = new ReplayClient({
      protocol: configuration.replayServerProtocol,
      hostName: configuration.replayServerHostName,
      port: configuration.replayServerPort,
      path: '/perform-replay/v2'
    });

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    logger.info('Flow server started.', { healthPort: configuration.healthPort });

    const issueCommand = async function ({ command }: { command: CommandWithMetadata<CommandData> }): Promise<void> {
      await commandDispatcherClient.postCommand({ command });
    };

    const requestReplay = async function ({ flowName, contextIdentifier, aggregateIdentifier, from, to }: {
      flowName: string;
      contextIdentifier: ContextIdentifier;
      aggregateIdentifier: AggregateIdentifier;
      from: number;
      to: number;
    }): Promise<void> {
      await replayClient.performReplay({
        flowNames: [ flowName ],
        aggregates: [
          { contextIdentifier, aggregateIdentifier, from, to }
        ]
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
