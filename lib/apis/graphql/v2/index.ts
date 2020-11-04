import { ApolloServer } from 'apollo-server-express';
import { Application } from '../../../common/application/Application';
import { ClientMetadata } from '../../../common/utils/http/ClientMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { errors } from '../../../common/errors';
import { Application as ExpressApplication } from 'express';
import { flaschenpost } from 'flaschenpost';
import { getApiBase } from '../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../base/getAuthenticationMiddleware';
import { getSchema } from './getSchema';
import { getSubscriptionOptions } from './observeDomainEvents/getSubscriptionOptions';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../InitializeGraphQlOnServer';
import { Notification } from '../../../common/elements/Notification';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { ResolverContext } from './ResolverContext';
import { Server } from 'http';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import { validateSchema } from 'graphql';

const logger = flaschenpost.getLogger();

const getV2 = async function ({
  corsOrigin,
  application,
  identityProviders,
  handleCommand,
  observeDomainEvents,
  observeNotifications,
  queryView,
  enableIntegratedClient,
  webSocketEndpoint
}: {
  corsOrigin: CorsOrigin;
  application: Application;
  identityProviders: IdentityProvider[];
  handleCommand: false | { onReceiveCommand: OnReceiveCommand; onCancelCommand: OnCancelCommand };
  observeDomainEvents: false | { repository: Repository };
  observeNotifications: false | { subscriber: Subscriber<Notification>; channelForNotifications: string };
  queryView: boolean;
  enableIntegratedClient: boolean;
  webSocketEndpoint?: string;
}): Promise<{
    api: ExpressApplication;
    publishDomainEvent?: PublishDomainEvent;
    initializeGraphQlOnServer: InitializeGraphQlOnServer;
  }> {
  if (!webSocketEndpoint && (observeDomainEvents || observeNotifications)) {
    throw new errors.ParameterInvalid('If observe domain events or observe notifications is enabled, a websocket endpoint must be given.');
  }

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

  const { schema, publishDomainEvent } = await getSchema({
    application,
    handleCommand,
    observeDomainEvents,
    observeNotifications,
    queryView
  });

  const schemaValidationErrors = validateSchema(schema);

  if (schemaValidationErrors.length > 0) {
    for (const error of schemaValidationErrors) {
      logger.error(error.message, { ex: error });
    }
    throw new errors.GraphQlError('GraphQL schema validation failed.');
  }

  const graphqlServer = new ApolloServer({
    schema,
    context ({
      req,
      connection
    }): ResolverContext {
      if (observeDomainEvents !== false && connection) {
        // If observeDomainEvents is true, the value returned here will be added
        // to the connection context when a WebSocket connection is initialized.
        // This way the clientMetadata is available in the subscription
        // resolvers.
        return connection.context;
      }

      return { clientMetadata: new ClientMetadata({ req }) };
    },
    subscriptions: webSocketEndpoint ?
      getSubscriptionOptions({
        identityProviders,
        webSocketEndpoint,
        issuerForAnonymousTokens: 'https://token.invalid'
      }) :
      undefined,
    introspection: true,
    playground: enableIntegratedClient ?
      { subscriptionEndpoint: webSocketEndpoint } :
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
