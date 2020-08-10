import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { NotificationHandler } from '../../../../lib/common/elements/NotificationHandler';
import { validateNotificationHandler } from '../../../../lib/common/validators/validateNotificationHandler';

suite('validateNotificationHandler', (): void => {
  const notificationHandler: NotificationHandler<Notification, any> = {
    isAuthorized (): boolean {
      return true;
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationHandler({ notificationHandler });
    }).is.not.throwing();
  });

  test('throws an error if the given notification handler is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationHandler({ notificationHandler: undefined });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.NotificationHandlerMalformed.code &&
            ex.message === `Notification handler is not an object.`
    );
  });

  test('throws an error if the notification handler has no is authorized function.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationHandler({
        notificationHandler: {}
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.NotificationHandlerMalformed.code &&
        ex.message === `Function 'isAuthorized' is missing.`
    );
  });

  test(`throws an error if the notification handler's is authorized property is not a function.`, async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationHandler({
        notificationHandler: {
          isAuthorized: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.NotificationHandlerMalformed.code &&
            ex.message === `Property 'isAuthorized' is not a function.`
    );
  });

  test(`throws an error if the notification handler's get schema property is not a function.`, async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationHandler({
        notificationHandler: {
          ...notificationHandler,
          getSchema: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.NotificationHandlerMalformed.code &&
            ex.message === `Property 'getSchema' is not a function.`
    );
  });

  test(`throws an error if the notification handler's get description property is not a function.`, async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationHandler({
        notificationHandler: {
          ...notificationHandler,
          getDocumentation: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.NotificationHandlerMalformed.code &&
            ex.message === `Property 'getDocumentation' is not a function.`
    );
  });
});
