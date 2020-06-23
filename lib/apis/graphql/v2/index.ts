import { Application } from '../../../common/application/Application';
import { ClientMetadata } from '../../../common/utils/http/ClientMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../common/elements/DomainEventWithState';
import { errors } from '../../../common/errors';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../base/getAuthenticationMiddleware';
import { getDomainEventWithStateSchema } from '../../../common/schemas/getDomainEventWithStateSchema';
import { getTypeDefinitions as getHandleCommandTypeDefinitions } from './handleCommand/getTypeDefinitions';
import { getMutationResolvers } from './handleCommand/getMutationResolvers';
import { getTypeDefinitions as getObserveDomainEventsTypeDefinitions } from './observeDomainEvents/getTypeDefinitions';
import { getSubscriptionOptions } from './observeDomainEvents/getSubscriptionOptions';
import { getSubscriptionResolvers } from './observeDomainEvents/getSubscriptionResolvers';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../InitializeGraphQlOnServer';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { Server } from 'http';
import { SpecializedEventEmitter } from '../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../common/elements/State';
import { stripIndent } from 'common-tags';
import { validateDomainEventWithState } from '../../../common/validators/validateDomainEventWithState';
import { Value } from 'validate-value';
import { ApolloServer, gql } from 'apollo-server-express';

const domainEventWithStateSchema = new Value(getDomainEventWithStateSchema());

const getV2 = async function ({
  corsOrigin,
  application,
  identityProviders,
  handleCommand,
  observeDomainEvents,
  enableIntegratedClient
}: {
  corsOrigin: CorsOrigin;
  application: Application;
  identityProviders: IdentityProvider[];
  handleCommand: false | { onReceiveCommand: OnReceiveCommand; onCancelCommand: OnCancelCommand };
  observeDomainEvents: false | { repository: Repository; webSocketEndpoint: string };
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

  let publishDomainEvent: undefined | PublishDomainEvent,
      typeDefinitions = '';
  const resolvers: any = {};

  if (handleCommand !== false) {
    typeDefinitions += `${getHandleCommandTypeDefinitions({ application })}\n`;
    resolvers.Mutation = getMutationResolvers({
      application,
      onReceiveCommand: handleCommand.onReceiveCommand,
      onCancelCommand: handleCommand.onCancelCommand
    });
  }

  if (observeDomainEvents !== false) {
    const domainEventEmitter = new SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>();

    typeDefinitions += `${getObserveDomainEventsTypeDefinitions()}\n`;
    resolvers.Subscription = getSubscriptionResolvers({
      application,
      repository: observeDomainEvents.repository,
      domainEventEmitter
    });

    publishDomainEvent = function ({ domainEvent }): void {
      try {
        domainEventWithStateSchema.validate(domainEvent, { valueName: 'domainEvent' });
      } catch (ex) {
        throw new errors.DomainEventMalformed(ex.message);
      }
      validateDomainEventWithState({ domainEvent, application });

      domainEventEmitter.emit(domainEvent);
    };
  }

  typeDefinitions += stripIndent`
    type Query {
      _: Boolean
    }
  `;

  const graphqlServer = new ApolloServer({
    typeDefs: gql(typeDefinitions),
    resolvers,
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
