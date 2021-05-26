import { assert } from 'assertthat';
import { Notification } from '../../../../lib/common/elements/Notification';
import { NotificationSubscriber } from '../../../../lib/common/elements/NotificationSubscriber';
import { parseNotificationSubscriber } from '../../../../lib/common/parsers/parseNotificationSubscriber';

suite('parseNotificationSubscriber', (): void => {
  const notificationSubscriber: NotificationSubscriber<Notification, any> = {
    isRelevant (): boolean {
      return true;
    },
    handle (): void {
      // Intentionally left empty.
    }
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseNotificationSubscriber({
        notificationSubscriber
      })
    ).is.not.anError();
  });

  test('returns an error if the notification subscriber is not an object.', async (): Promise<void> => {
    assert.that(
      parseNotificationSubscriber({
        notificationSubscriber: undefined
      })
    ).is.anErrorWithMessage('Notification subscriber is not an object.');
  });

  test('returns an error if is relevant is missing.', async (): Promise<void> => {
    assert.that(
      parseNotificationSubscriber({ notificationSubscriber: {
        ...notificationSubscriber,
        isRelevant: undefined
      }})
    ).is.anErrorWithMessage(`Function 'isRelevant' is missing.`);
  });

  test('returns an error if is relevant is not a function.', async (): Promise<void> => {
    assert.that(
      parseNotificationSubscriber({ notificationSubscriber: {
        ...notificationSubscriber,
        isRelevant: {}
      }})
    ).is.anErrorWithMessage(`Property 'isRelevant' is not a function.`);
  });

  test('returns an error if handle is missing.', async (): Promise<void> => {
    assert.that(
      parseNotificationSubscriber({ notificationSubscriber: {
        ...notificationSubscriber,
        handle: undefined
      }})
    ).is.anErrorWithMessage(`Function 'handle' is missing.`);
  });

  test('returns an error if handle is not a function.', async (): Promise<void> => {
    assert.that(
      parseNotificationSubscriber({ notificationSubscriber: {
        ...notificationSubscriber,
        handle: {}
      }})
    ).is.anErrorWithMessage(`Property 'handle' is not a function.`);
  });
});
