import { ApplicationDefinition } from './ApplicationDefinition';
import errors from '../errors';
import exists from '../utils/fs/exists';
import getCommandDefinitions from './getCommandDefinitions';
import getDomainEventDefinitions from './getDomainEventDefinitions';
import getViewDefinitions from './getViewDefinitions';
import path from 'path';

const getApplicationDefinition = async function ({ applicationDirectory }: {
  applicationDirectory: string;
}): Promise<ApplicationDefinition> {
  if (!await exists({ path: applicationDirectory })) {
    throw new errors.ApplicationNotFound();
  }

  const serverDirectory = path.join(applicationDirectory, 'server');

  if (!await exists({ path: serverDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/server' not found.`);
  }

  const domainDirectory = path.join(serverDirectory, 'domain');
  const viewsDirectory = path.join(serverDirectory, 'views');

  const commandDefinitions = await getCommandDefinitions({ domainDirectory });
  const domainEventDefinitions = await getDomainEventDefinitions({ domainDirectory });
  const viewDefinitions = await getViewDefinitions({ viewsDirectory });

  return {
    commands: commandDefinitions,
    domainEvents: domainEventDefinitions,
    views: viewDefinitions
  };
};

export default getApplicationDefinition;
