import { AskInfrastructure } from '../../../../lib/common/elements/AskInfrastructure';
import { assert } from 'assertthat';
import { Notifications } from '../../../../lib/common/elements/Notifications';
import { parseNotifications } from '../../../../lib/common/parsers/parseNotifications';
import { TellInfrastructure } from '../../../../lib/common/elements/TellInfrastructure';

suite('parseNotifications', (): void => {
  const notificationsDefinition: Notifications<AskInfrastructure & TellInfrastructure> = {
    sampleNotification: {
      isAuthorized (): boolean {
        return true;
      }
    }
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseNotifications({ notificationsDefinition })
    ).is.not.anError();
  });

  test('returns an error if the given notifications definition is not an object.', async (): Promise<void> => {
    assert.that(
      parseNotifications({ notificationsDefinition: undefined })
    ).is.anErrorWithMessage(`Notifications definition is not an object.`);
  });

  test('returns an error if a malformed notification handler is found.', async (): Promise<void> => {
    assert.that(
      parseNotifications({
        notificationsDefinition: {
          sampleHandler: false
        }
      })
    ).is.anErrorWithMessage(`Notification handler 'sampleHandler' is malformed: Notification handler is not an object.`);
  });

  test('returns an error if a notification handler without is authorized function is found.', async (): Promise<void> => {
    assert.that(
      parseNotifications({
        notificationsDefinition: {
          sampleHandler: {}
        }
      })
    ).is.anErrorWithMessage(`Notification handler 'sampleHandler' is malformed: Function 'isAuthorized' is missing.`);
  });
});
