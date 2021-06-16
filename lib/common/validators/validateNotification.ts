import { Application } from '../application/Application';
import { Notification } from '../elements/Notification';
import { parse } from 'validate-value';
import * as errors from '../errors';

const validateNotification = function ({
  notification,
  application
}: {
  notification: Notification;
  application: Application;
}): void {
  const notificationDefinitions = application.notifications;

  const {
    name,
    data,
    metadata
  } = notification;

  if (!(name in notificationDefinitions)) {
    throw new errors.NotificationNotFound(`Notification '${name}' not found.`);
  }

  const { getDataSchema, getMetadataSchema } = notificationDefinitions[name];

  if (getDataSchema) {
    const schema = getDataSchema();

    parse(data, schema, { valueName: 'notification.data' }).unwrapOrThrow();
  }
  if (getMetadataSchema) {
    const schema = getMetadataSchema();

    parse(metadata, schema, { valueName: 'notification.metadata' }).unwrapOrThrow();
  }
};

export { validateNotification };
