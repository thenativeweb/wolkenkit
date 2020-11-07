#!/usr/bin/env node

import { configurationDefinition } from './configurationDefinition';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import { getOnReceiveMessage } from './getOnReceiveMessage';
import http from 'http';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    const subscriber = await createSubscriber<object>(configuration.pubSubOptions.subscriber);
    const publisher = await createPublisher<object>(configuration.pubSubOptions.publisher);

    const onReceiveMessage = getOnReceiveMessage({
      publisher
    });

    const { api, publishMessage } = await getApi({
      configuration,
      onReceiveMessage
    });

    subscriber.subscribe({
      channel: '*',
      callback (message): void {
        // This callback has its scope set by the subscriber. To make
        // TypeScript understand this, we have to forcibly convert the type.
        publishMessage({ channel: (this as any as { event: string }).event, message });
      }
    });

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info(
        'Publisher server started.',
        { port: configuration.port, healthPort: configuration.healthPort }
      );
    });
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
