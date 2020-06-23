import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getGraphqlApi } from '../../../../apis/graphql';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../../../../apis/graphql/InitializeGraphQlOnServer';
import { OnCancelCommand } from '../../../../apis/graphql/OnCancelCommand';
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

  const { api: handleCommandGraphqlApi, publishDomainEvent: publishDomainEventToGraphqlApi, initializeGraphQlOnServer } = await getGraphqlApi({
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
