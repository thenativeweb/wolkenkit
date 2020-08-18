import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { executeNotificationSubscribers } from '../../../../lib/common/domain/executeNotificationSubscribers';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { LoggerService } from '../../../../lib/common/services/LoggerService';
import { Notification } from '../../../../lib/common/elements/Notification';
import { NotificationDefinition } from '../../../../lib/common/elements/NotificationDefinition';
import { NotificationService } from '../../../../lib/common/services/NotificationService';

suite('executeNotificationSubscribers', (): void => {
  let application: Application,
      loggedMessages: { level: string; message: string; metadata?: object }[],
      loggerService: LoggerService,
      notifications: Notification[],
      notificationService: NotificationService;

  setup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

    application = await loadApplication({ applicationDirectory });

    loggedMessages = [];
    loggerService = {
      debug (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'debug', message, metadata });
      },
      info (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'info', message, metadata });
      },
      warn (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'warn', message, metadata });
      },
      error (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'error', message, metadata });
      },
      fatal (message: string, metadata?: object): void {
        loggedMessages.push({ level: 'fatal', message, metadata });
      }
    } as LoggerService;
    notifications = [];
    notificationService = {
      publish<TNotificationDefinition extends NotificationDefinition>(
        name: string,
        data: TNotificationDefinition['data'],
        metadata?: TNotificationDefinition['metadata']
      ): void {
        notifications.push({ name, data, metadata });
      }
    };
  });

  test('throws an error if the view name does not exist.', async (): Promise<void> => {
    const notification = {
      name: 'foo',
      data: {}
    };

    await assert.that(async (): Promise<void> => {
      await executeNotificationSubscribers({
        application,
        viewName: 'non-existent',
        notification,
        services: {
          logger: loggerService,
          notification: notificationService
        }
      });
    }).is.throwingAsync<CustomError>((ex): boolean =>
      ex.code === errors.ViewNotFound.code &&
        ex.message === `View 'non-existent' not found.`);
  });

  test('executes the relevant subscribers and publishes their notifications.', async (): Promise<void> => {
    const notification = {
      name: 'flowSampleFlowUpdated',
      data: {}
    };

    await executeNotificationSubscribers({
      application,
      viewName: 'sampleView',
      notification,
      services: {
        logger: loggerService,
        notification: notificationService
      }
    });

    assert.that(notifications.length).is.equalTo(1);
    assert.that(notifications[0]).is.equalTo({
      name: 'viewSampleViewUpdated',
      data: {},
      metadata: undefined
    });
  });

  test('does nothing if the notification is not relevant to any subscriber.', async (): Promise<void> => {
    const notification = {
      name: 'irrelevant',
      data: {}
    };

    await executeNotificationSubscribers({
      application,
      viewName: 'sampleView',
      notification,
      services: {
        logger: loggerService,
        notification: notificationService
      }
    });

    assert.that(notifications.length).is.equalTo(0);
  });
});
