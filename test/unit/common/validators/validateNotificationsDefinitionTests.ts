import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { Notifications } from '../../../../lib/common/elements/Notifications';
import { validateNotificationsDefinition } from '../../../../lib/common/validators/validateNotificationsDefinition';

suite('validateNotificationsDefinition', (): void => {
  const notificationsDefinition: Notifications = {
    sampleNotification: {
      isAuthorized (): boolean {
        return true;
      }
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationsDefinition({ notificationsDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the given notifications definition is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationsDefinition({ notificationsDefinition: undefined });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.NotificationsDefinitionMalformed.code &&
            ex.message === `Notifications definition is not an object.`
    );
  });

  test('throws an error if a malformed notification handler is found.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationsDefinition({
        notificationsDefinition: {
          sampleHandler: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.NotificationsDefinitionMalformed.code &&
        ex.message === `Notification handler 'sampleHandler' is malformed: Notification handler is not an object.`
    );
  });

  test('throws an error if a notification handler without is authorized function is found.', async (): Promise<void> => {
    assert.that((): void => {
      validateNotificationsDefinition({
        notificationsDefinition: {
          sampleHandler: {}
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.NotificationsDefinitionMalformed.code &&
            ex.message === `Notification handler 'sampleHandler' is malformed: Function 'isAuthorized' is missing.`
    );
  });
});
