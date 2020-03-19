import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getGraphqlApi } from '../../../../apis/graphql';
import { getApi as getHandleCommandApi } from '../../../../apis/handleCommand/http';
import { getApi as getObserveDomainEventsApi } from '../../../../apis/observeDomainEvents/http';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../../../../apis/graphql/InitializeGraphQlOnServer';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import express, { Application } from 'express';

const getApi = async function ({
  configuration,
  applicationDefinition,
  identityProviders,
  onReceiveCommand,
  repository
}: {
  configuration: Configuration;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
  onReceiveCommand: OnReceiveCommand;
  repository: Repository;
}): Promise<{
    api: Application;
    publishDomainEvent: PublishDomainEvent;
    initializeGraphQlOnServer: InitializeGraphQlOnServer | undefined;
  }> {
  const api = express();
  const corsOrigin = getCorsOrigin(configuration.corsOrigin);

  let initializeGraphQlOnServer: undefined | InitializeGraphQlOnServer,
      publishDomainEventToGraphqlApi: undefined | PublishDomainEvent,
      publishDomainEventToRestApi: undefined | PublishDomainEvent;

  if (configuration.httpApi) {
    const { api: observeDomainEventsApi, publishDomainEvent } = await getObserveDomainEventsApi({
      corsOrigin,
      applicationDefinition,
      identityProviders,
      repository
    });

    publishDomainEventToRestApi = publishDomainEvent;

    const { api: handleCommandApi } = await getHandleCommandApi({
      corsOrigin,
      onReceiveCommand,
      applicationDefinition,
      identityProviders
    });

    api.use('/domain-events', observeDomainEventsApi);
    api.use('/command', handleCommandApi);
  }

  if (configuration.graphqlApi !== false) {
    const { api: graphqlApi, publishDomainEvent, initializeGraphQlOnServer: initializeGraphql } = await getGraphqlApi({
      corsOrigin,
      applicationDefinition,
      identityProviders,
      handleCommand: {
        onReceiveCommand
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
