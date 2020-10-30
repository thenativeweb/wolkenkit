import { Notifications } from '../elements/Notifications';
import { NotificationsDescription } from './NotificationsDescription';
import { stripIndent } from 'common-tags';

const getNotificationsDescription = function ({ notificationsDefinition }: {
  notificationsDefinition: Notifications;
}): NotificationsDescription {
  const notificationsDescription: NotificationsDescription = {};

  for (const [ notificationName, notificationHandler ] of Object.entries(notificationsDefinition)) {
    const description = {} as any;

    if (notificationHandler.getDocumentation) {
      description.documentation = stripIndent(notificationHandler.getDocumentation().trim());
    }
    if (notificationHandler.getDataSchema) {
      description.dataSchema = notificationHandler.getDataSchema();
    }
    if (notificationHandler.getMetadataSchema) {
      description.metadataSchema = notificationHandler.getMetadataSchema();
    }

    notificationsDescription[notificationName] = description;
  }

  return notificationsDescription;
};

export { getNotificationsDescription };
