#!/usr/bin/env node

import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { configurationDefinition } from './configurationDefinition';
import { createPriorityQueueStore } from '../../../../stores/priorityQueueStore/createPriorityQueueStore';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
import { doesItemIdentifierWithClientMatchCommandWithMetadata } from '../../../../common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import { getOnCancelCommand } from './getOnCancelCommand';
import { getOnReceiveCommand } from './getOnReceiveCommand';
import http from 'http';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../common/application/loadApplication';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    logger.info(
      'Starting command dispatcher server...',
      withLogMetadata('runtime', 'microprocess/command')
    );

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const priorityQueueStore = await createPriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>({
      ...configuration.priorityQueueStoreOptions,
      doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata
    });

    const newCommandSubscriber = await createSubscriber<object>(configuration.pubSubOptions.subscriber);

    const newCommandPublisher = await createPublisher<object>(configuration.pubSubOptions.publisher);

    const onReceiveCommand = getOnReceiveCommand({
      priorityQueueStore,
      newCommandPublisher,
      newCommandPubSubChannel: configuration.pubSubOptions.channelForNewCommands
    });
    const onCancelCommand = getOnCancelCommand({ priorityQueueStore });

    // Publish "new command" events on an interval even if there are no new
    // commands so that missed events or crashing workers will not lead to
    // unprocessed commands.
    setInterval(
      async (): Promise<void> => {
        await newCommandPublisher.publish({
          channel: configuration.pubSubOptions.channelForNewCommands,
          message: {}
        });
        logger.debug(
          'Sent "new command" event on interval.',
          withLogMetadata('runtime', 'microservice/commandDispatcher')
        );
      },
      configuration.missedCommandRecoveryInterval
    );

    const { api } = await getApi({
      configuration,
      application,
      priorityQueueStore: priorityQueueStore as PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifier>,
      newCommandSubscriber,
      newCommandPubSubChannel: configuration.pubSubOptions.channelForNewCommands,
      onReceiveCommand,
      onCancelCommand
    });

    await runHealthServer({
      corsOrigin: configuration.healthCorsOrigin,
      portOrSocket: configuration.healthPortOrSocket
    });

    const server = http.createServer(api);

    server.listen(configuration.portOrSocket, (): void => {
      logger.info(
        'Started command dispatcher server.',
        withLogMetadata(
          'runtime',
          'microservice/commandDispatcher',
          { portOrSocket: configuration.portOrSocket, healthPortOrSocket: configuration.healthPortOrSocket }
        )
      );
    });
  } catch (ex: unknown) {
    logger.fatal(
      'An unexpected error occured.',
      withLogMetadata('runtime', 'microservice/commandDispatcher', { error: ex })
    );
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
