import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { validateViewDefinition } from '../../../../lib/common/validators/validateViewDefinition';
import { View } from '../../../../lib/common/elements/View';

suite('validateViewDefinition', (): void => {
  const viewDefinition: View = {
    queryHandlers: {},
    notificationSubscribers: {}
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the given view definition is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.ViewDefinitionMalformed.code && ex.message === `View handler is not an object.`);
  });

  test('throws an error if query handlers are missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          queryHandlers: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ViewDefinitionMalformed.code &&
        ex.message === `Object 'queryHandlers' is missing.`
    );
  });

  test('throws an error if query handlers are not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          queryHandlers: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ViewDefinitionMalformed.code &&
        ex.message === `Property 'queryHandlers' is not an object.`
    );
  });

  test('throws an error if a malformed query handler is found.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          queryHandlers: {
            sampleQuery: false
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ViewDefinitionMalformed.code &&
        ex.message === `Query handler 'sampleQuery' is malformed: Query handler is not an object.`
    );
  });

  test('throws an error if notification subscribers are missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          notificationSubscribers: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ViewDefinitionMalformed.code &&
            ex.message === `Object 'notificationSubscribers' is missing.`
    );
  });

  test('throws an error if notification subscribers are not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          notificationSubscribers: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ViewDefinitionMalformed.code &&
            ex.message === `Property 'notificationSubscribers' is not an object.`
    );
  });

  test('throws an error if a malformed notification subscriber is found.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          notificationSubscribers: {
            sampleNotificationSubscriber: false
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ViewDefinitionMalformed.code &&
            ex.message === `Notification subscriber 'sampleNotificationSubscriber' is malformed: Notification subscriber is not an object.`
    );
  });
});
