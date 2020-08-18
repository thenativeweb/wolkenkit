#!/usr/bin/env node

import { configurationDefinition } from './configurationDefinition';
import { createPriorityQueueStore } from '../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
import { doesItemIdentifierWithClientMatchDomainEvent } from '../../../../common/domain/doesItemIdentifierWithClientMatchDomainEvent';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import { getOnReceiveDomainEvent } from './getOnReceiveDomainEvent';
import http from 'http';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../common/application/loadApplication';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
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

    const priorityQueueStore = await createPriorityQueueStore<DomainEvent<DomainEventData>, ItemIdentifierWithClient>({
      ...configuration.priorityQueueStoreOptions,
      doesIdentifierMatchItem: doesItemIdentifierWithClientMatchDomainEvent
    });

    const internalNewDomainEventSubscriber = await createSubscriber<object>(configuration.pubSubOptions.subscriber);

    const internalNewDomainEventPublisher = await createPublisher<object>(configuration.pubSubOptions.publisher);

    // Publish "new domain event" events on an interval even if there are no new
    // domain events so that missed events or crashing workers will not lead to
    // unprocessed domain events.
    setInterval(
      async (): Promise<void> => {
        await internalNewDomainEventPublisher.publish({
          channel: configuration.pubSubOptions.channelForNewInternalDomainEvents,
          message: {}
        });
      },
      configuration.missedDomainEventRecoveryInterval
    );

    const { api } = await getApi({
      configuration,
      application,
      priorityQueueStore,
      newDomainEventSubscriber: internalNewDomainEventSubscriber,
      newDomainEventPubSubChannel: configuration.pubSubOptions.channelForNewInternalDomainEvents,
      onReceiveDomainEvent: getOnReceiveDomainEvent({
        application,
        newDomainEventPublisher: internalNewDomainEventPublisher,
        newDomainEventPubSubChannel: configuration.pubSubOptions.channelForNewInternalDomainEvents,
        priorityQueueStore
      })
    });

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info(
        'Domain event dispatcher server started.',
        { port: configuration.port, healthPort: configuration.healthPort }
      );
    });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
