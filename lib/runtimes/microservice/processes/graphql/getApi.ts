import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getGraphqlApi } from '../../../../apis/graphql';
import { getApi as getLandingPageApi } from '../../../../apis/landingPage/http';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../../../../apis/graphql/InitializeGraphQlOnServer';
import { Notification } from '../../../../common/elements/Notification';
import { OnCancelCommand } from '../../../../apis/graphql/OnCancelCommand';
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
  subscriber,
  channelForNotifications
}: {
  configuration: Configuration;
  application: Application;
  identityProviders: IdentityProvider[];
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  repository: Repository;
  subscriber: Subscriber<Notification>;
  channelForNotifications: string;
}): Promise<{
    api: ExpressApplication;
    publishDomainEvent: PublishDomainEvent;
    initializeGraphQlOnServer: InitializeGraphQlOnServer | undefined;
  }> {
  const corsOrigin = getCorsOrigin(configuration.corsOrigin);

  const { api: landingPageApi } = await getLandingPageApi();
  const { api: handleCommandGraphqlApi, publishDomainEvent: publishDomainEventToGraphqlApi, initializeGraphQlOnServer } = await getGraphqlApi({
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
    enableIntegratedClient: configuration.enableIntegratedClient,
    webSocketEndpoint: '/graphql/v2/'
  });

  const api = express();

  api.use(landingPageApi);
  api.use('/graphql', handleCommandGraphqlApi);

  const publishDomainEvent: PublishDomainEvent = ({ domainEvent }): void => {
    if (publishDomainEventToGraphqlApi) {
      publishDomainEventToGraphqlApi({ domainEvent });
    }
  };

  return { api, initializeGraphQlOnServer, publishDomainEvent };
};

export { getApi };
