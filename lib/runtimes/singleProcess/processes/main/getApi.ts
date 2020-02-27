import { ApolloServer } from 'apollo-server-express';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getGraphqlApi } from '../../../../apis/graphql/http';
import { getApi as getHandleCommandApi } from '../../../../apis/handleCommand/http';
import { getApi as getObserveDomainEventsApi } from '../../../../apis/observeDomainEvents/http';
import { IdentityProvider } from 'limes';
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
}): Promise<{ api: Application; publishDomainEvent: PublishDomainEvent; graphqlServer: undefined | ApolloServer }> {
  const api = express();
  const corsOrigin = getCorsOrigin(configuration.corsOrigin);

  let graphqlServer: undefined | ApolloServer,
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
    const { api: handleCommandGraphqlApi, graphqlServer: server, publishDomainEvent } = await getGraphqlApi({
      corsOrigin,
      applicationDefinition,
      identityProviders,
      handleCommand: {
        onReceiveCommand
      },
      observeDomainEvents: {
        repository,
        webSocketEndpoint: configuration.graphqlApi.endpoint
      },
      playground: configuration.graphqlApi.playground
    });

    graphqlServer = server;
    publishDomainEventToGraphqlApi = publishDomainEvent;

    api.use('/graphql', handleCommandGraphqlApi);
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

  return { api, graphqlServer, publishDomainEvent };
};

export { getApi };
