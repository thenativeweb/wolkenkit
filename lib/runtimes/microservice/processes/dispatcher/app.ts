#!/usr/bin/env node

import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { createPriorityQueueStore } from '../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getConfiguration } from './getConfiguration';
import { getOnReceiveCommand } from './getOnReceiveCommand';
import http from 'http';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = getConfiguration();

    const applicationDefinition = await getApplicationDefinition({
      applicationDirectory: configuration.applicationDirectory
    });

    const priorityQueueStore = await createPriorityQueueStore<CommandWithMetadata<CommandData>>({
      type: configuration.priorityQueueStoreType,
      options: {
        ...configuration.priorityQueueStoreOptions,
        expirationTime: configuration.priorityQueueStoreOptions.expirationTime
      }
    });

    const newCommandSubscriber = await createSubscriber<object>({
      type: configuration.pubSubType,
      options: configuration.pubSubOptions.subscriber
    });

    const newCommandPublisher = await createPublisher<object>({
      type: configuration.pubSubType,
      options: configuration.pubSubOptions.publisher
    });

    const onReceiveCommand = getOnReceiveCommand({
      priorityQueueStore,
      newCommandPublisher,
      newCommandPubSubChannel: configuration.pubSubOptions.channel
    });

    // Publish new command events on an interval even if there are no new
    // commands so that missed events or crashing workers will not lead to
    // unprocessed commands.
    setInterval(
      async (): Promise<void> => {
        await newCommandPublisher.publish({
          channel: configuration.pubSubOptions.channel,
          message: {}
        });
      },
      configuration.missedCommandRecoveryInterval
    );

    const { api } = await getApi({
      configuration,
      applicationDefinition,
      priorityQueueStore,
      newCommandSubscriber,
      newCommandPubSubChannel: configuration.pubSubOptions.channel,
      onReceiveCommand
    });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info('Dispatcher server started.', { port: configuration.port });
    });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
