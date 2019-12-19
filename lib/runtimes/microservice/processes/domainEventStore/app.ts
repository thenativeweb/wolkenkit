#!/usr/bin/env node

import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getConfiguration } from './getConfiguration';
import http from 'http';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = getConfiguration();

    const domainEventStore = await createDomainEventStore({
      type: configuration.domainEventStoreType,
      options: configuration.domainEventStoreOptions
    });

    const newDomainEventSubscriber = await createSubscriber<object>({
      type: configuration.pubSubType,
      options: configuration.pubSubOptions.subscriber
    });

    const newDomainEventPublisher = await createPublisher<object>({
      type: configuration.pubSubType,
      options: configuration.pubSubOptions.publisher
    });

    const { api } = await getApi({
      configuration,
      domainEventStore,
      newDomainEventPublisher,
      newDomainEventSubscriber,
      newDomainEventPubSubChannel: configuration.pubSubOptions.channel
    });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info('Domain event store server started.', { port: configuration.port });
    });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
