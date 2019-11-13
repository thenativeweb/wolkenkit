import { ApplicationDefinition } from './ApplicationDefinition';
import { ApplicationDescription } from './ApplicationDescription';
import { getCommandsDescription } from './getCommandsDescription';
import { getDomainEventsDescription } from './getDomainEventsDescription';
import { getViewsDescription } from './getViewsDescription';

const getApplicationDescription = function ({ applicationDefinition }: {
  applicationDefinition: ApplicationDefinition;
}): ApplicationDescription {
  const applicationDescription: ApplicationDescription = {
    commands: getCommandsDescription({ domainDefinition: applicationDefinition.domain }),
    domainEvents: getDomainEventsDescription({ domainDefinition: applicationDefinition.domain }),
    views: getViewsDescription({ viewsDefinition: applicationDefinition.views })
  };

  return applicationDescription;
};

export { getApplicationDescription };
