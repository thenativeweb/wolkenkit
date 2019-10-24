import { ApplicationDescription } from './ApplicationDescription';
import { getApplicationDefinition } from './getApplicationDefinition';
import { getCommandDescriptions } from './getCommandDescriptions';
import { getDomainEventDescriptions } from './getDomainEventDescriptions';
import { getViewDescriptions } from './getViewDescriptions';

const getApplicationDescription = async function ({ applicationDirectory }: {
  applicationDirectory: string;
}): Promise<ApplicationDescription> {
  const applicationDefinition = await getApplicationDefinition({ applicationDirectory });

  const applicationDescription: ApplicationDescription = {
    commands: getCommandDescriptions({ commandDefinitions: applicationDefinition.commands }),
    domainEvents: getDomainEventDescriptions({ domainEventDefinitions: applicationDefinition.domainEvents }),
    views: getViewDescriptions({ viewDefinitions: applicationDefinition.views })
  };

  return applicationDescription;
};

export getApplicationDescription;
