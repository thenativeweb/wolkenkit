import { assert } from 'assertthat';
import { NotificationHandler } from '../../../../lib/common/elements/NotificationHandler';
import { parseNotificationHandler } from '../../../../lib/common/parsers/parseNotificationHandler';

suite('parseNotificationHandler', (): void => {
  const notificationHandler: NotificationHandler<Notification, any> = {
    isAuthorized (): boolean {
      return true;
    }
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseNotificationHandler({ notificationHandler })
    ).is.not.anError();
  });

  test('returns an error if the given notification handler is not an object.', async (): Promise<void> => {
    assert.that(
      parseNotificationHandler({ notificationHandler: undefined })
    ).is.anErrorWithMessage(`Notification handler is not an object.`);
  });

  test('returns an error if the notification handler has no is authorized function.', async (): Promise<void> => {
    assert.that(
      parseNotificationHandler({
        notificationHandler: {}
      })
    ).is.anErrorWithMessage(`Function 'isAuthorized' is missing.`);
  });

  test(`returns an error if the notification handler's is authorized property is not a function.`, async (): Promise<void> => {
    assert.that(
      parseNotificationHandler({
        notificationHandler: {
          isAuthorized: false
        }
      })
    ).is.anErrorWithMessage(`Property 'isAuthorized' is not a function.`);
  });

  test(`returns an error if the notification handler's get data schema property is not a function.`, async (): Promise<void> => {
    assert.that(
      parseNotificationHandler({
        notificationHandler: {
          ...notificationHandler,
          getDataSchema: false
        }
      })
    ).is.anErrorWithMessage(`Property 'getDataSchema' is not a function.`);
  });

  test(`returns an error if the notification handler's get metadata schema property is not a function.`, async (): Promise<void> => {
    assert.that(
      parseNotificationHandler({
        notificationHandler: {
          ...notificationHandler,
          getMetadataSchema: false
        }
      })
    ).is.anErrorWithMessage(`Property 'getMetadataSchema' is not a function.`);
  });

  test(`returns an error if the notification handler's get description property is not a function.`, async (): Promise<void> => {
    assert.that(
      parseNotificationHandler({
        notificationHandler: {
          ...notificationHandler,
          getDocumentation: false
        }
      })
    ).is.anErrorWithMessage(`Property 'getDocumentation' is not a function.`);
  });
});
