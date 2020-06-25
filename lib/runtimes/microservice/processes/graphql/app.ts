#!/usr/bin/env node

import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { createPriorityQueueStore } from '../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { doesItemIdentifierWithClientMatchCommandWithMetadata } from '../../../../common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getConfiguration } from './getConfiguration';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import http from 'http';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../common/application/loadApplication';
import { OnCancelCommand } from '../../../../apis/graphql/OnCancelCommand';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../shared/runHealthServer';
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

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await createDomainEventStore({
      type: configuration.domainEventStoreType,
      options: configuration.domainEventStoreOptions
    });

    const repository = new Repository({
      application,
      lockStore: await createLockStore({ type: 'InMemory', options: {}}),
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy)
    });

    const priorityQueueStore = await createPriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>({
      type: 'InMemory',
      doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata,
      options: {}
    });

    const onReceiveCommand: OnReceiveCommand = async ({ command }): Promise<void> => {
      await priorityQueueStore.enqueue({
        item: command,
        discriminator: command.aggregateIdentifier.id,
        priority: command.metadata.timestamp
      });
    };

    const onCancelCommand: OnCancelCommand = async ({ commandIdentifierWithClient }: {
      commandIdentifierWithClient: ItemIdentifierWithClient;
    }): Promise<void> => {
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

    const subscribeMessagesClient = new SubscribeMessagesClient({
      protocol: configuration.subscribeMessagesProtocol,
      hostName: configuration.subscribeMessagesHostName,
      port: configuration.subscribeMessagesPort,
      path: '/subscribe/v2'
    });

    const messageStream = await subscribeMessagesClient.getMessages({
      channel: configuration.subscribeMessagesChannel
    });

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
