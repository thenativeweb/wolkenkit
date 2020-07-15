import { ApolloServer } from 'apollo-server-express';
import { Application } from '../../../common/application/Application';
import { ClientMetadata } from '../../../common/utils/http/ClientMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../base/getAuthenticationMiddleware';
import { getSchema } from './getSchema';
import { getSubscriptionOptions } from './observeDomainEvents/getSubscriptionOptions';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../InitializeGraphQlOnServer';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { Server } from 'http';

const getV2 = async function ({
  corsOrigin,
  application,
  identityProviders,
  handleCommand,
  observeDomainEvents,
  queryView,
  enableIntegratedClient
}: {
  corsOrigin: CorsOrigin;
  application: Application;
  identityProviders: IdentityProvider[];
  handleCommand: false | { onReceiveCommand: OnReceiveCommand; onCancelCommand: OnCancelCommand };
  observeDomainEvents: false | { repository: Repository; webSocketEndpoint: string };
  queryView: boolean;
  enableIntegratedClient: boolean;
}): Promise<{
    api: ExpressApplication;
    publishDomainEvent?: PublishDomainEvent;
    initializeGraphQlOnServer: InitializeGraphQlOnServer;
  }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }},
      query: { parser: { useJson: false }}
    },
    response: {
      headers: { cache: false }
    }
  });

  const authenticationMiddleware = await getAuthenticationMiddleware({
    identityProviders
  });

  api.use(authenticationMiddleware);

  const { schema, publishDomainEvent } = getSchema({
    application,
    handleCommand,
    observeDomainEvents,
    queryView
  });

  const graphqlServer = new ApolloServer({
    schema,
    context ({
      req,
      connection
    }): { clientMetadata: ClientMetadata } {
      if (observeDomainEvents !== false && connection) {
        // If observeDomainEvents is true, the value returned here will be added
        // to the connection context when a WebSocket connection is initialized.
        // This way the clientMetadata is available in the subscription
        // resolvers.
        return connection.context;
      }

      return { clientMetadata: new ClientMetadata({ req }) };
    },
    subscriptions: observeDomainEvents !== false ?
      getSubscriptionOptions({
        identityProviders,
        webSocketEndpoint: observeDomainEvents.webSocketEndpoint,
        issuerForAnonymousTokens: 'https://token.invalid'
      }) :
      undefined,
    introspection: true,
    playground: enableIntegratedClient ?
      {
        subscriptionEndpoint: observeDomainEvents !== false ?
          observeDomainEvents.webSocketEndpoint :
          undefined
      } :
      false
  });

  graphqlServer.applyMiddleware({
    app: api,
    path: '/'
  });

  const initializeGraphQlOnServer = async ({ server }: {
    server: Server;
  }): Promise<void> => {
    graphqlServer.installSubscriptionHandlers(server);
  };

  return { api, publishDomainEvent, initializeGraphQlOnServer };
};

export { getV2 };
