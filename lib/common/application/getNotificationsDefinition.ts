import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { Notifications } from '../elements/Notifications';
import { validateNotificationsDefinition } from '../validators/validateNotificationsDefinition';

const getNotificationsDefinition = async function ({ notificationsDirectory }: {
  notificationsDirectory: string;
}): Promise<Notifications> {
  if (!await exists({ path: notificationsDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/notifications' not found.`);
  }

  let notificationsDefinition: Notifications;

  try {
    notificationsDefinition = (await import(notificationsDirectory)).default;
  } catch (ex) {
    if (ex instanceof SyntaxError) {
      throw new errors.ApplicationMalformed(`Syntax error in '<app>/build/server/notifications'.`, { cause: ex });
    }

    // But throw an error if the entry is a directory without importable content.
    throw new errors.FileNotFound(`No notifications definition in '<app>/build/server/notifications' found.`);
  }

  try {
    validateNotificationsDefinition({ notificationsDefinition });
  } catch (ex) {
    throw new errors.NotificationsDefinitionMalformed(`Notifications definition '<app>/build/server/notifications' is malformed: ${ex.message}`);
  }

  return notificationsDefinition;
};

export { getNotificationsDefinition };
