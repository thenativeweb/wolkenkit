import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { validateNotification } from '../../../../lib/common/validators/validateNotification';

suite('validateNotification', (): void => {
  let application: Application;

  setup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

    application = await loadApplication({ applicationDirectory });
  });

  test('throws an error if the published notification name is unknown.', async (): Promise<void> => {
    const notification = {
      name: 'someUnknownNotification',
      data: {}
    };

    await assert.that(async (): Promise<void> => {
      validateNotification({ notification, application });
    }).is.throwingAsync(`Notification 'someUnknownNotification' not found.`);
  });

  test(`throws an error if the published notification's data does not match its schema.`, async (): Promise<void> => {
    const notification = {
      name: 'complex',
      data: {}
    };

    await assert.that(async (): Promise<void> => {
      validateNotification({ notification, application });
    }).is.throwingAsync('Missing required property: message (at notification.data.message).');
  });

  test(`throws an error if the published notification's metadata does not match its schema.`, async (): Promise<void> => {
    const notification = {
      name: 'complex',
      data: { message: 'foo' },
      metadata: {}
    };

    await assert.that(async (): Promise<void> => {
      validateNotification({ notification, application });
    }).is.throwingAsync('Missing required property: public (at notification.metadata.public).');
  });
});
