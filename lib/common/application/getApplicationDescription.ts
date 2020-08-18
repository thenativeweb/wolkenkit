import { Application } from './Application';
import { ApplicationDescription } from './ApplicationDescription';
import { getCommandsDescription } from './getCommandsDescription';
import { getDomainEventsDescription } from './getDomainEventsDescription';
import { getNotificationsDescription } from './getNotificationsDescription';
import { getViewsDescription } from './getViewsDescription';

const getApplicationDescription = function ({ application }: {
  application: Application;
}): ApplicationDescription {
  const applicationDescription: ApplicationDescription = {
    commands: getCommandsDescription({ domainDefinition: application.domain }),
    domainEvents: getDomainEventsDescription({ domainDefinition: application.domain }),
    notifications: getNotificationsDescription({ notificationsDefinition: application.notifications }),
    views: getViewsDescription({ viewsDefinition: application.views })
  };

  return applicationDescription;
};

export { getApplicationDescription };
