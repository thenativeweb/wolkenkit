import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { Notification } from '../../../../common/elements/Notification';
import PQueue from 'p-queue';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { validateNotification } from '../../../../common/validators/validateNotification';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';
import { Request, Response } from 'express';

const logger = flaschenpost.getLogger();

const getNotifications = {
  description: 'Subscribes to notifications.',
  path: '',

  request: {},
  response: {
    statusCodes: [ 200 ],

    stream: true,
    body: {}
  },

  getHandler ({
    application,
    subscriber,
    channelForNotifications,
    heartbeatInterval
  }: {
    application: Application;
    subscriber: Subscriber<Notification>;
    channelForNotifications: string;
    heartbeatInterval: number;
  }): WolkenkitRequestHandler {
    return async function (req: Request, res: Response): Promise<void> {
      res.startStream({ heartbeatInterval });

      try {
        const notificationQueue = new PQueue({ concurrency: 1 });

        const handleNotification = (notification: Notification): void => {
          try {
            validateNotification({ notification, application });
          } catch {
            logger.warn('Dropping invalid notification.', { notification });

            return;
          }

          const notificationHandler = application.notifications[notification.name];

          if (!notificationHandler.isAuthorized(notification.data, notification.metadata, {
            logger: getLoggerService({
              fileName: `<app>/server/notifications/${notification.name}`,
              packageManifest: application.packageManifest
            }),
            infrastructure: application.infrastructure,
            client: getClientService({ clientMetadata: new ClientMetadata({ req }) })
          })) {
            return;
          }

          const notificationWithoutMetadata = {
            name: notification.name,
            data: notification.data
          };

          /* eslint-disable @typescript-eslint/no-floating-promises */
          notificationQueue.add(async (): Promise<void> => {
            writeLine({ res, data: notificationWithoutMetadata });
          });
          /* eslint-enable @typescript-eslint/no-floating-promises */
        };

        res.socket?.once('close', async (): Promise<void> => {
          await subscriber.unsubscribe({ channel: channelForNotifications, callback: handleNotification });
          notificationQueue.clear();
        });

        await subscriber.subscribe({ channel: channelForNotifications, callback: handleNotification });
      } catch (ex: unknown) {
        // It can happen that the connection gets closed in the background, and
        // hence the underlying socket does not have a remote address any more. We
        // can't detect this using an if statement, because connection handling is
        // done by Node.js in a background thread, and we may have a race
        // condition here. So, we decided to actively catch this exception, and
        // take it as an indicator that the connection has been closed meanwhile.
        if (ex instanceof Error && ex.message === 'Remote address is missing.') {
          return;
        }

        logger.error('An unexpected error occured.', { ex });

        throw ex;
      }
    };
  }
};

export { getNotifications };
