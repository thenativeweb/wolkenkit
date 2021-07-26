import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { Application } from '../../../common/application/Application';
import { ClientMetadata } from '../../../common/utils/http/ClientMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../base/getAuthenticationMiddleware';
import { getHandleSubscriptionAuthorization } from './getHandleSubscriptionAuthorization';
import { getSchema } from './getSchema';
import http from 'http';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../InitializeGraphQlOnServer';
import { makeServer } from 'graphql-ws';
import { Notification } from '../../../common/elements/Notification';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { ResolverContext } from './ResolverContext';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import { validateSchema } from 'graphql';
import { withLogMetadata } from '../../../common/utils/logging/withLogMetadata';
import ws from 'ws';
import { flaschenpost, getMiddleware as getLoggingMiddleware } from 'flaschenpost';
import * as errors from '../../../common/errors';

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
      headers: {
        cors: { origin: corsOrigin },

        // If the GraphQL playground is enabled, CSP must be disabled for the apollo cdn to work.
        csp: !enableIntegratedClient
      },
      body: { parser: { sizeLimit: 100_000 }},
      query: { parser: { useJson: false }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.use(getLoggingMiddleware());

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
      logger.fatal(
        'GraphQL schema validation failed.',
        withLogMetadata('api', 'graphql', { error })
      );
    }
    throw new errors.GraphQlError('GraphQL schema validation failed.');
  }

  const graphqlServer = new ApolloServer({
    schema,
    context ({ req }): ResolverContext {
      return { clientMetadata: new ClientMetadata({ req }) };
    },
    introspection: true,
    plugins: enableIntegratedClient ?
      [
        // eslint-disable-next-line new-cap
        ApolloServerPluginLandingPageGraphQLPlayground({
          endpoint: webSocketEndpoint
        })
      ] :
      []
  });

  await graphqlServer.start();

  graphqlServer.applyMiddleware({
    app: api,
    path: '/',
    cors: false
  });

  const initializeGraphQlOnServer = async ({ server }: {
    server: http.Server;
  }): Promise<void> => {
    if (!observeDomainEvents && !observeNotifications) {
      return;
    }

    const handleSubscriptionAuthorization = getHandleSubscriptionAuthorization({
      identityProviders,
      issuerForAnonymousTokens: 'https://token.invalid'
    });
    const graphqlSubscriptionServer = makeServer<{
      readonly request: http.IncomingMessage;
    }>({
      schema,
      async context (ctx): Promise<{ clientMetadata: ClientMetadata }> {
        return await handleSubscriptionAuthorization(ctx);
      }
    });

    const wsServer = new ws.Server({
      server,
      path: webSocketEndpoint
    });

    // The following snippet is more or less directly taken from the examples
    // of [graphql-ws](https://github.com/enisdenjo/graphql-ws).
    wsServer.on('connection', (socket, request): void => {
      const closed = graphqlSubscriptionServer.opened(
        {
          protocol: socket.protocol,
          async send (data): Promise<void> {
            await new Promise<void>((resolve, reject): void => {
              socket.send(
                data,
                (err): void => {
                  if (err) {
                    reject(err);

                    return;
                  }
                  resolve();
                }
              );
            });
          },
          close (code, reason): void {
            socket.close(code, reason);
          },
          onMessage (cb): void {
            socket.on(
              'message',
              async (event): Promise<void> => {
                try {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                  await cb(event.toString());
                } catch (ex: unknown) {
                  socket.close(1_011, (ex as Error).message);
                }
              }
            );
          }
        },
        { request }
      );

      socket.once(
        'close',
        async (code, reason): Promise<void> => {
          await closed(code, reason);
        }
      );
    });
  };

  return { api, publishDomainEvent, initializeGraphQlOnServer };
};

export { getV2 };
