import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getGraphqlApi } from '../../../../apis/graphql';
import { getApi as getHandleCommandApi } from '../../../../apis/handleCommand/http';
import { getApi as getManageFileApi } from '../../../../apis/manageFile/http';
import { getApi as getObserveDomainEventsApi } from '../../../../apis/observeDomainEvents/http';
import { getApi as getOpenApiApi } from '../../../../apis/openApi/http';
import { getApi as getQueryViewApi } from '../../../../apis/queryView/http';
import { getApi as getSubscribeNotificationsApi } from '../../../../apis/subscribeNotifications/http';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../../../../apis/graphql/InitializeGraphQlOnServer';
import { Notification } from '../../../../common/elements/Notification';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  configuration,
  application,
  identityProviders,
  onReceiveCommand,
  onCancelCommand,
  repository,
  fileStore,
  subscriber,
  channelForNotifications
}: {
  configuration: Configuration;
  application: Application;
  identityProviders: IdentityProvider[];
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  repository: Repository;
  fileStore: FileStore;
  subscriber: Subscriber<Notification>;
  channelForNotifications: string;
}): Promise<{
    api: ExpressApplication;
    publishDomainEvent: PublishDomainEvent;
    initializeGraphQlOnServer: InitializeGraphQlOnServer | undefined;
  }> {
  const api = express();
  const corsOrigin = getCorsOrigin(configuration.corsOrigin);

  let initializeGraphQlOnServer: undefined | InitializeGraphQlOnServer,
      publishDomainEventToGraphqlApi: undefined | PublishDomainEvent,
      publishDomainEventToRestApi: undefined | PublishDomainEvent;

  if (configuration.httpApi) {
    const { api: observeDomainEventsApi, publishDomainEvent, getApiDefinitions: getObserveDomainEventApiDefinitions } =
      await getObserveDomainEventsApi({
        corsOrigin,
        application,
        identityProviders,
        repository,
        heartbeatInterval: configuration.heartbeatInterval
      });

    publishDomainEventToRestApi = publishDomainEvent;

    const { api: handleCommandApi, getApiDefinitions: getHandleCommandApiDefinitions } = await getHandleCommandApi({
      corsOrigin,
      onReceiveCommand,
      onCancelCommand,
      application,
      identityProviders
    });

    const { api: queryViewApi, getApiDefinitions: getQueryViewApiDefinitions } = await getQueryViewApi({
      corsOrigin,
      application,
      identityProviders
    });

    const { api: manageFileApi, getApiDefinitions: getManageFileApiDefinitions } = await getManageFileApi({
      application,
      corsOrigin,
      identityProviders,
      fileStore
    });

    const { api: subscribeNotificationsApi } = await getSubscribeNotificationsApi({
      application,
      corsOrigin,
      identityProviders,
      channelForNotifications,
      subscriber,
      heartbeatInterval: configuration.heartbeatInterval
    });

    api.use('/command', handleCommandApi);
    api.use('/domain-events', observeDomainEventsApi);
    api.use('/files', manageFileApi);
    api.use('/notifications', subscribeNotificationsApi);
    api.use('/views', queryViewApi);

    if (configuration.enableOpenApiDocumentation) {
      const { api: openApiApi } = await getOpenApiApi({
        corsOrigin,
        application,
        title: 'Single process runtime API',
        schemes: [ 'http' ],
        apis: [
          ...getHandleCommandApiDefinitions('command'),
          ...getObserveDomainEventApiDefinitions('domain-events'),
          ...getManageFileApiDefinitions('files'),
          ...getQueryViewApiDefinitions('views')
        ]
      });

      api.use('/open-api', openApiApi);
    }
  }

  if (configuration.graphqlApi !== false) {
    const { api: graphqlApi, publishDomainEvent, initializeGraphQlOnServer: initializeGraphql } = await getGraphqlApi({
      corsOrigin,
      application,
      identityProviders,
      handleCommand: {
        onReceiveCommand,
        onCancelCommand
      },
      observeDomainEvents: {
        repository
      },
      observeNotifications: {
        subscriber,
        channelForNotifications
      },
      queryView: true,
      enableIntegratedClient: configuration.graphqlApi.enableIntegratedClient,
      webSocketEndpoint: '/graphql/v2/'
    });

    initializeGraphQlOnServer = initializeGraphql;
    publishDomainEventToGraphqlApi = publishDomainEvent;

    api.use('/graphql', graphqlApi);
  }

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const publishDomainEvent: PublishDomainEvent = ({ domainEvent }): void => {
    if (publishDomainEventToGraphqlApi) {
      publishDomainEventToGraphqlApi({ domainEvent });
    }
    if (publishDomainEventToRestApi) {
      publishDomainEventToRestApi({ domainEvent });
    }
  };

  return { api, initializeGraphQlOnServer, publishDomainEvent };
};

export { getApi };
