import { Application } from '../application/Application';
import { errors } from '../errors';
import { Notification } from '../elements/Notification';
import { Value } from 'validate-value';

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
    const value = new Value(schema);

    value.validate(data, { valueName: 'notification.data' });
  }
  if (getMetadataSchema) {
    const schema = getMetadataSchema();
    const value = new Value(schema);

    value.validate(metadata, { valueName: 'notification.metadata' });
  }
};

export { validateNotification };
