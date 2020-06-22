import { Application } from './Application';
import { ApplicationDescription } from './ApplicationDescription';
import { getCommandsDescription } from './getCommandsDescription';
import { getDomainEventsDescription } from './getDomainEventsDescription';
import { getViewsDescription } from './getViewsDescription';

const getApplicationDescription = function ({ application }: {
  application: Application;
}): ApplicationDescription {
  const applicationDescription: ApplicationDescription = {
    commands: getCommandsDescription({ domainDefinition: application.domain }),
    domainEvents: getDomainEventsDescription({ domainDefinition: application.domain }),
    views: getViewsDescription({ viewsDefinition: application.views })
  };

  return applicationDescription;
};

export { getApplicationDescription };
