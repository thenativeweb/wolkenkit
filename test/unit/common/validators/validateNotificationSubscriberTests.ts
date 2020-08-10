import { Notification } from '../../../../lib/common/elements/Notification';
import { NotificationSubscriber } from '../../../../lib/common/elements/NotificationSubscriber';
import { assert } from 'assertthat';
import { validateNotificationSubscriber } from '../../../../lib/common/validators/validateNotificationSubscriber';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';

suite('validateNotificationSubscriber', (): void => {
  const notificationSubscriber: NotificationSubscriber<Notification, any> = {
    isRelevant (): boolean {
      return true;
    },
    handle (): void {
      // Intentionally left empty.
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationSubscriber({
        notificationSubscriber
      });
    }).is.not.throwing();
  });

  test('throws an error if the notification subscriber is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationSubscriber({
        notificationSubscriber: undefined
      });
    }).is.throwing<CustomError>((ex): boolean =>
      ex.code === errors.NotificationSubscriberMalformed.code &&
      ex.message === 'Notification subscriber is not an object.');
  });

  test('throws an error if is relevant is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationSubscriber({ notificationSubscriber: {
        ...notificationSubscriber,
        isRelevant: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.NotificationSubscriberMalformed.code && ex.message === `Function 'isRelevant' is missing.`);
  });

  test('throws an error if is relevant is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationSubscriber({ notificationSubscriber: {
        ...notificationSubscriber,
        isRelevant: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.NotificationSubscriberMalformed.code && ex.message === `Property 'isRelevant' is not a function.`);
  });

  test('throws an error if handle is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationSubscriber({ notificationSubscriber: {
        ...notificationSubscriber,
        handle: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.NotificationSubscriberMalformed.code && ex.message === `Function 'handle' is missing.`);
  });

  test('throws an error if handle is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationSubscriber({ notificationSubscriber: {
        ...notificationSubscriber,
        handle: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.NotificationSubscriberMalformed.code && ex.message === `Property 'handle' is not a function.`);
  });
});
