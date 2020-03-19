import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getGraphqlApi } from '../../../../apis/graphql';
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

  const { api: handleCommandGraphqlApi, publishDomainEvent: publishDomainEventToGraphqlApi, initializeGraphQlOnServer } = await getGraphqlApi({
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
    enableIntegratedClient: configuration.enableIntegratedClient
  });

  api.use('/graphql', handleCommandGraphqlApi);

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const publishDomainEvent: PublishDomainEvent = ({ domainEvent }): void => {
    if (publishDomainEventToGraphqlApi) {
      publishDomainEventToGraphqlApi({ domainEvent });
    }
  };

  return { api, initializeGraphQlOnServer, publishDomainEvent };
};

export { getApi };
