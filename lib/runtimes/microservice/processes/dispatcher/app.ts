#!/usr/bin/env node

import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { createPriorityQueueStore } from '../../../../stores/priorityQueueStore/createPriorityQueueStore';
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
        expirationTime: configuration.queueLockExpirationTime
      }
    });

    const onReceiveCommand = getOnReceiveCommand({
      priorityQueueStore
    });

    const { api } = await getApi({
      configuration,
      applicationDefinition,
      priorityQueueStore,
      onReceiveCommand,
      queuePollInterval: configuration.queuePollInterval
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
