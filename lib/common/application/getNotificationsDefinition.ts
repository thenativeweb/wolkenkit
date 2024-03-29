import { AskInfrastructure } from '../elements/AskInfrastructure';
import { exists } from '../utils/fs/exists';
import { isErrnoException } from '../utils/isErrnoException';
import { Notifications } from '../elements/Notifications';
import { parseNotifications } from '../parsers/parseNotifications';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import * as errors from '../errors';

const getNotificationsDefinition = async function ({ notificationsDirectory }: {
  notificationsDirectory: string;
}): Promise<Notifications<AskInfrastructure & TellInfrastructure>> {
  if (!await exists({ path: notificationsDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/notifications' not found.`);
  }

  let notificationsDefinition: Notifications<AskInfrastructure & TellInfrastructure>;

  try {
    notificationsDefinition = (await import(notificationsDirectory)).default;
  } catch (ex: unknown) {
    if (ex instanceof SyntaxError) {
      throw new errors.ApplicationMalformed({ message: `Syntax error in '<app>/build/server/notifications'.`, cause: ex });
    }
    if (isErrnoException(ex) && ex.code === 'MODULE_NOT_FOUND') {
      throw new errors.ApplicationMalformed({ message: `Missing import in '<app>/build/server/notifications'.`, cause: ex as Error });
    }

    // But throw an error if the entry is a directory without importable content.
    throw new errors.FileNotFound(`No notifications definition in '<app>/build/server/notifications' found.`);
  }

  return parseNotifications({ notificationsDefinition }).unwrapOrThrow(
    (err): Error => new errors.NotificationsDefinitionMalformed(`Notifications definition '<app>/build/server/notifications' is malformed: ${err.message}`)
  );
};

export { getNotificationsDefinition };
