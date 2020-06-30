#!/usr/bin/env node

import { createPriorityQueueStore } from '../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
import { doesItemIdentifierWithClientMatchDomainEvent } from '../../../../common/domain/doesItemIdentifierWithClientMatchDomainEvent';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getConfiguration } from './getConfiguration';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import http from 'http';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../common/application/loadApplication';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';
import { Client as SubscribeMessagesClient } from '../../../../apis/subscribeMessages/http/v2/Client';
import { validateDomainEvent } from '../../../../common/validators/validateDomainEvent';
import { Value } from 'validate-value';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = getConfiguration();

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const priorityQueueStore = await createPriorityQueueStore<DomainEvent<DomainEventData>, ItemIdentifierWithClient>({
      type: configuration.priorityQueueStoreType,
      doesIdentifierMatchItem: doesItemIdentifierWithClientMatchDomainEvent,
      options: {
        ...configuration.priorityQueueStoreOptions,
        expirationTime: configuration.priorityQueueStoreOptions.expirationTime
      }
    });

    const internalNewDomainEventSubscriber = await createSubscriber<object>({
      type: configuration.pubSubType,
      options: configuration.pubSubOptions.subscriber
    });

    const internalNewDomainEventPublisher = await createPublisher<object>({
      type: configuration.pubSubType,
      options: configuration.pubSubOptions.publisher
    });

    // Publish new command events on an interval even if there are no new
    // commands so that missed events or crashing workers will not lead to
    // unprocessed commands.
    setInterval(
      async (): Promise<void> => {
        await internalNewDomainEventPublisher.publish({
          channel: configuration.pubSubOptions.channel,
          message: {}
        });
      },
      configuration.missedCommandRecoveryInterval
    );

    const { api } = await getApi({
      configuration,
      application,
      priorityQueueStore,
      newDomainEventSubscriber: internalNewDomainEventSubscriber,
      newDomainEventPubSubChannel: configuration.pubSubOptions.channel
    });

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info(
        'CommandDispatcher server started.',
        { port: configuration.port, healthPort: configuration.healthPort }
      );
    });

    const externalNewDomainEventSubscriber = new SubscribeMessagesClient({
      protocol: configuration.subscribeMessagesProtocol,
      hostName: configuration.subscribeMessagesHostName,
      port: configuration.subscribeMessagesPort,
      path: '/subscribe/v2'
    });

    const domainEventStream = await externalNewDomainEventSubscriber.getMessages({
      channel: configuration.subscribeMessagesChannel
    });

    for await (const rawDomainEvent of domainEventStream) {
      const domainEvent = new DomainEvent<DomainEventData>(rawDomainEvent);

      try {
        new Value(getDomainEventSchema()).validate(domainEvent);
        validateDomainEvent({ domainEvent, application });
      } catch (ex) {
        logger.error('Received a message via the publisher with an unexpected format.', { domainEvent, ex });

        return;
      }

      for (const flowName of Object.keys(application.flows)) {
        await priorityQueueStore.enqueue({
          item: domainEvent,
          discriminator: flowName,
          priority: domainEvent.metadata.timestamp
        });
      }
      await internalNewDomainEventPublisher.publish({
        channel: configuration.pubSubOptions.channel,
        message: {}
      });
    }
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
