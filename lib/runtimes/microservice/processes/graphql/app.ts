#!/usr/bin/env node

import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getConfiguration } from './getConfiguration';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import http from 'http';
import { InMemoryPriorityQueueStore } from '../../../../stores/priorityQueueStore/InMemory';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../../runtimes/shared/runHealthServer';
import { State } from '../../../../common/elements/State';
import { Client as SubscribeMessagesClient } from '../../../../apis/subscribeMessages/http/v2/Client';

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

    const subscribeMessagesClient = new SubscribeMessagesClient({
      protocol: configuration.subscribeMessagesProtocol,
      hostName: configuration.subscribeMessagesHostName,
      port: configuration.subscribeMessagesPort,
      path: '/subscribe/v2'
    });

    const messageStream = await subscribeMessagesClient.getMessages();

    await runHealthServer({ corsOrigin: configuration.corsOrigin, port: configuration.healthPort });

    await new Promise((resolve): void => {
      server.listen(configuration.port, (): void => {
        resolve();
      });
    });

    logger.info(
      'GraphQL server started.',
      { port: configuration.port, healthPort: configuration.healthPort }
    );

    for await (const message of messageStream) {
      const domainEvent = new DomainEventWithState<DomainEventData, State>(message);

      publishDomainEvent({ domainEvent });
    }
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
