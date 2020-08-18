import { Notifications } from '../elements/Notifications';
import { NotificationsDescription } from './NotificationsDescription';
import { stripIndent } from 'common-tags';

const getNotificationsDescription = function ({ notificationsDefinition }: {
  notificationsDefinition: Notifications;
}): NotificationsDescription {
  const notificationsDescription: NotificationsDescription = {};

  for (const [ notificationName, notificationHandler ] of Object.entries(notificationsDefinition)) {
    const { getDocumentation, getDataSchema, getMetadataSchema } = notificationHandler;

    const description = {} as any;

    if (getDocumentation) {
      description.documentation = stripIndent(getDocumentation().trim());
    }
    if (getDataSchema) {
      description.dataSchema = getDataSchema();
    }
    if (getMetadataSchema) {
      description.metadataSchema = getMetadataSchema();
    }

    notificationsDescription[notificationName] = description;
  }

  return notificationsDescription;
};

export { getNotificationsDescription };
