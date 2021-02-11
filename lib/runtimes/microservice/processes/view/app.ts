#!/usr/bin/env node

import { configurationDefinition } from './configurationDefinition';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
import { executeNotificationSubscribers } from '../../../../common/domain/executeNotificationSubscribers';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import http from 'http';
import { loadApplication } from '../../../../common/application/loadApplication';
import { Notification } from '../../../../common/elements/Notification';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { runHealthServer } from '../../../shared/runHealthServer';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: configuration.identityProviders
    });

    const publisher = await createPublisher<Notification>(configuration.pubSubOptions.publisher);
    const subscriber = await createSubscriber<Notification>(configuration.pubSubOptions.subscriber);

    const { api } = await getApi({
      application,
      configuration,
      identityProviders
    });

    await runHealthServer({
      corsOrigin: configuration.healthCorsOrigin,
      portOrSocket: configuration.healthPortOrSocket
    });

    const server = http.createServer(api);

    server.listen(configuration.portOrSocket, (): void => {
      logger.info('View server started.', {
        portOrSocket: configuration.portOrSocket,
        healthPortOrSocket: configuration.healthPortOrSocket
      });
    });

    await subscriber.subscribe({
      channel: configuration.pubSubOptions.channelForNotifications,
      async callback (notification: Notification): Promise<void> {
        const notifications: Notification[] = [];

        for (const viewName of Object.keys(application.views)) {
          await executeNotificationSubscribers({
            application,
            viewName,
            notification,
            services: {
              logger: getLoggerService({
                packageManifest: application.packageManifest,
                fileName: `<app>/server/views/${viewName}`
              }),
              notification: {
                publish (name, data, metadata): void {
                  notifications.push({ name, data, metadata });
                }
              }
            }
          });
        }

        for (const newNotification of notifications) {
          await publisher.publish({
            channel: configuration.pubSubOptions.channelForNotifications,
            message: newNotification
          });
        }
      }
    });
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { err: ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
