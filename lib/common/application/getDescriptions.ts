import { ApplicationDescription } from '../elements/Descriptions';
import errors from '../errors';
import exists from '../utils/fs/exists';
import getCommandsDescription from './getCommandsDescription';
import getDomainEventsDescription from './getDomainEventsDescription';
import getViewsDescription from './getViewsDescription';
import path from 'path';

const getDescriptions = async function ({ applicationDirectory }: {
  applicationDirectory: string;
}): Promise<ApplicationDescription> {
  if (!await exists({ path: applicationDirectory })) {
    throw new errors.ApplicationNotFound();
  }

  const serverDirectory = path.join(applicationDirectory, 'server');

  if (!await exists({ path: serverDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/server' not found.`);
  }

  const domainDirectory = path.join(serverDirectory, 'domain');
  const viewsDirectory = path.join(serverDirectory, 'views');

  const commandsDescription = await getCommandsDescription({ domainDirectory });
  const domainEventsDescription = await getDomainEventsDescription({ domainDirectory });
  const viewsDescription = await getViewsDescription({ viewsDirectory });

  return {
    commandsDescription,
    domainEventsDescription,
    viewsDescription
  };
};

export default getDescriptions;
