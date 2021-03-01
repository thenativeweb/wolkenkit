#!/usr/bin/env node

import { configurationDefinition } from './configurationDefinition';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import fs from 'fs';
import { getApi } from './getApi';
import http from 'http';
import { PriorityQueueObserver } from '../../../../stores/priorityQueueStore/Observer';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    const priorityQueueStore = await PriorityQueueObserver.create(
      {
        type: 'observer',
        observedQueueOptions: {
          ...configuration.priorityQueueStoreOptions,
          doesIdentifierMatchItem (): boolean {
            return false;
          }
        }
      },
      async (state): Promise<void> => {
        await fs.promises.writeFile(configuration.crashHandlerTargetFile, JSON.stringify(state), 'utf-8');
      }
    );

    const internalNewItemSubscriber = await createSubscriber<object>(configuration.pubSubOptions.subscriber);

    const internalNewItemPublisher = await createPublisher<object>(configuration.pubSubOptions.publisher);

    // Publish "new domain event" events on an interval even if there are no new
    // domain events so that missed events or crashing workers will not lead to
    // unprocessed domain events.
    setInterval(
      async (): Promise<void> => {
        await internalNewItemPublisher.publish({
          channel: configuration.pubSubOptions.channelForNewItems,
          message: {}
        });
      },
      configuration.missedItemRecoveryInterval
    );

    const { api } = await getApi({
      configuration,
      priorityQueueStore,
      newItemSubscriber: internalNewItemSubscriber,
      newItemPubSubChannel: configuration.pubSubOptions.channelForNewItems,
      async onReceiveItem ({ message }: {
        message: object;
      }): Promise<void> {
        await priorityQueueStore.enqueue(message as any);
        await internalNewItemPublisher.publish({
          channel: configuration.pubSubOptions.channelForNewItems,
          message: {}
        });
      }
    });

    await runHealthServer({
      corsOrigin: configuration.healthCorsOrigin,
      portOrSocket: configuration.healthPortOrSocket
    });

    const server = http.createServer(api);

    server.listen(configuration.portOrSocket, (): void => {
      logger.info('Domain event dispatcher server started.', {
        portOrSocket: configuration.portOrSocket,
        healthPortOrSocket: configuration.healthPortOrSocket
      });
    });
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
