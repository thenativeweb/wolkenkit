import { AskInfrastructure } from '../../../../lib/common/elements/AskInfrastructure';
import { assert } from 'assertthat';
import { parseView } from '../../../../lib/common/parsers/parseView';
import { TellInfrastructure } from '../../../../lib/common/elements/TellInfrastructure';
import { View } from '../../../../lib/common/elements/View';

suite('parseView', (): void => {
  const viewDefinition: View<AskInfrastructure & TellInfrastructure> = {
    queryHandlers: {}
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseView({ viewDefinition })
    ).is.not.anError();
  });

  test('returns an error if the given view definition is not an object.', async (): Promise<void> => {
    assert.that(
      parseView({ viewDefinition: undefined })
    ).is.anErrorWithMessage(`View handler is not an object.`);
  });

  test('returns an error if query handlers are missing.', async (): Promise<void> => {
    assert.that(
      parseView({
        viewDefinition: {
          ...viewDefinition,
          queryHandlers: undefined
        }
      })
    ).is.anErrorWithMessage(`Object 'queryHandlers' is missing.`);
  });

  test('returns an error if query handlers are not an object.', async (): Promise<void> => {
    assert.that(
      parseView({
        viewDefinition: {
          ...viewDefinition,
          queryHandlers: false
        }
      })
    ).is.anErrorWithMessage(`Property 'queryHandlers' is not an object.`);
  });

  test('returns an error if a malformed query handler is found.', async (): Promise<void> => {
    assert.that(
      parseView({
        viewDefinition: {
          ...viewDefinition,
          queryHandlers: {
            sampleQuery: false
          }
        }
      })
    ).is.anErrorWithMessage(`Query handler 'sampleQuery' is malformed: Query handler is not an object.`);
  });

  test('returns an error if notification subscribers are not an object.', async (): Promise<void> => {
    assert.that(
      parseView({
        viewDefinition: {
          ...viewDefinition,
          notificationSubscribers: false
        }
      })
    ).is.anErrorWithMessage(`Property 'notificationSubscribers' is not an object.`);
  });

  test('returns an error if a malformed notification subscriber is found.', async (): Promise<void> => {
    assert.that(
      parseView({
        viewDefinition: {
          ...viewDefinition,
          notificationSubscribers: {
            sampleNotificationSubscriber: false
          }
        }
      })
    ).is.anErrorWithMessage(`Notification subscriber 'sampleNotificationSubscriber' is malformed: Notification subscriber is not an object.`);
  });
});
