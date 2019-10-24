import { ApplicationDefinition } from './ApplicationDefinition';
import { ApplicationDescription } from './ApplicationDescription';
import { getCommandDescriptions } from './getCommandDescriptions';
import { getDomainEventDescriptions } from './getDomainEventDescriptions';
import { getViewDescriptions } from './getViewDescriptions';

const getApplicationDescription = function ({ applicationDefinition }: {
  applicationDefinition: ApplicationDefinition;
}): ApplicationDescription {
  const applicationDescription: ApplicationDescription = {
    commands: getCommandDescriptions({ commandDefinitions: applicationDefinition.commands }),
    domainEvents: getDomainEventDescriptions({ domainEventDefinitions: applicationDefinition.domainEvents }),
    views: getViewDescriptions({ viewDefinitions: applicationDefinition.views })
  };

  return applicationDescription;
};

export { getApplicationDescription };
