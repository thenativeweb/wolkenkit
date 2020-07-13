import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getGraphqlApi } from '../../../../apis/graphql';
import { getApi as getHandleCommandApi } from '../../../../apis/handleCommand/http';
import { getApi as getObserveDomainEventsApi } from '../../../../apis/observeDomainEvents/http';
import { getApi as getOpenApiApi } from '../../../../apis/openApi/http';
import { getApi as getViewsApi } from '../../../../apis/queryView/http';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../../../../apis/graphql/InitializeGraphQlOnServer';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  configuration,
  application,
  identityProviders,
  onReceiveCommand,
  onCancelCommand,
  repository
}: {
  configuration: Configuration;
  application: Application;
  identityProviders: IdentityProvider[];
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  repository: Repository;
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
        repository
      });

    publishDomainEventToRestApi = publishDomainEvent;

    const { api: handleCommandApi, getApiDefinitions: getHandleCommandApiDefinitions } = await getHandleCommandApi({
      corsOrigin,
      onReceiveCommand,
      onCancelCommand,
      application,
      identityProviders
    });

    const { api: viewsApi } = await getViewsApi({
      corsOrigin,
      application,
      identityProviders
    });

    api.use('/domain-events', observeDomainEventsApi);
    api.use('/command', handleCommandApi);
    api.use('/views', viewsApi);

    if (configuration.enableOpenApiDocumentation) {
      const { api: openApiApi } = await getOpenApiApi({
        corsOrigin,
        application,
        title: 'Single process runtime API',
        schemes: [ 'http' ],
        apis: [
          ...getHandleCommandApiDefinitions('command'),
          ...getObserveDomainEventApiDefinitions('domain-events')
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
        repository,
        webSocketEndpoint: '/graphql/v2/'
      },
      enableIntegratedClient: configuration.graphqlApi.enableIntegratedClient
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
