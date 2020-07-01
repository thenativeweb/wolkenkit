#!/usr/bin/env node

import { AeonstoreDomainEventStore } from '../../../../stores/domainEventStore/Aeonstore';
import { CommandData } from '../../../../common/elements/CommandData';
import { Client as CommandDispatcherClient } from '../../../../apis/handleCommandWithMetadata/http/v2/Client';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { createConsumerProgressStore } from '../../../../stores/consumerProgressStore/createConsumerProgressStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { Client as DomainEventDispatcherClient } from '../../../../apis/awaitItem/http/v2/Client';
import { flaschenpost } from 'flaschenpost';
import { getConfiguration } from './getConfiguration';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { loadApplication } from '../../../../common/application/loadApplication';
import pForever from 'p-forever';
import { processDomainEvent } from './processDomainEvent';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../shared/runHealthServer';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = getConfiguration();

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await AeonstoreDomainEventStore.create({
      hostName: configuration.aeonstoreHostName,
      port: configuration.aeonstorePort
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

    const consumerProgressStore = await createConsumerProgressStore({
      type: configuration.consumerProgressStoreType,
      options: configuration.consumerProgressStoreOptions
    });

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

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    logger.info('Flow server started.', { healthPort: configuration.healthPort });

    const onIssueCommand = async function ({ command }: { command: CommandWithMetadata<CommandData> }): Promise<void> {
      await commandDispatcherClient.postCommand({ command });
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
          onIssueCommand
        });
      });
    }
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
