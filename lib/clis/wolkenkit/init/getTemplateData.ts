import { configurationDefinition as commandConfigurationDefinition } from '../../../runtimes/microservice/processes/command/configurationDefinition';
import { configurationDefinition as commandDispatcherConfigurationDefinition } from '../../../runtimes/microservice/processes/commandDispatcher/configurationDefinition';
import { configurationDefinition as domainConfigurationDefinition } from '../../../runtimes/microservice/processes/domain/configurationDefinition';
import { configurationDefinition as domainEventConfigurationDefinition } from '../../../runtimes/microservice/processes/domainEvent/configurationDefinition';
import { configurationDefinition as domainEventDispatcherConfigurationDefinition } from '../../../runtimes/microservice/processes/domainEventDispatcher/configurationDefinition';
import { configurationDefinition as domainEventStoreConfigurationDefinition } from '../../../runtimes/microservice/processes/domainEventStore/configurationDefinition';
import { configurationDefinition as fileConfigurationDefinition } from '../../../runtimes/microservice/processes/file/configurationDefinition';
import { configurationDefinition as flowConfigurationDefinition } from '../../../runtimes/microservice/processes/flow/configurationDefinition';
import { configurationDefinition as graphqlConfigurationDefinition } from '../../../runtimes/microservice/processes/graphql/configurationDefinition';
import { configurationDefinition as notificationConfigurationDefinition } from '../../../runtimes/microservice/processes/notification/configurationDefinition';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../runtimes/microservice/processes/publisher/configurationDefinition';
import { configurationDefinition as replayConfigurationDefinition } from '../../../runtimes/microservice/processes/replay/configurationDefinition';
import { services } from './dockerCompose/services';
import { configurationDefinition as singleProcessMainConfigurationDefinition } from '../../../runtimes/singleProcess/processes/main/configurationDefinition';
import { toEnvironmentVariables } from '../../../runtimes/shared/toEnvironmentVariables';
import { versions } from '../../../versions';
import { configurationDefinition as viewConfigurationDefinition } from '../../../runtimes/microservice/processes/view/configurationDefinition';

const getTemplateData = function ({ appName }: {
  appName: string;
}): Record<string, any> {
  return {
    appName,
    applicationDirectory: '/app',
    configurationDefinitions: {
      microservice: {
        command: commandConfigurationDefinition,
        commandDispatcher: commandDispatcherConfigurationDefinition,
        domain: domainConfigurationDefinition,
        domainEvent: domainEventConfigurationDefinition,
        domainEventStore: domainEventStoreConfigurationDefinition,
        publisher: publisherConfigurationDefinition,
        graphql: graphqlConfigurationDefinition,
        domainEventDispatcher: domainEventDispatcherConfigurationDefinition,
        flow: flowConfigurationDefinition,
        replay: replayConfigurationDefinition,
        view: viewConfigurationDefinition,
        notification: notificationConfigurationDefinition,
        file: fileConfigurationDefinition
      },
      singleProcess: {
        main: singleProcessMainConfigurationDefinition
      }
    },
    corsOrigin: '*',
    identityProviders: [],
    services,
    toEnvironmentVariables,
    versions
  };
};

export { getTemplateData };
