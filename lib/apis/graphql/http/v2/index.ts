import { Application } from 'express';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getTypeDefinitions as getHandleCommandTypeDefinitions } from './handleCommand/getTypeDefinitions';
import { getMutationResolvers } from './handleCommand/getMutationResolvers';
import { getTypeDefinitions as getObserveDomainEventsTypeDefinitions } from './observeDomainEvents/getTypeDefinitions';
import { getSubscriptionOptions } from './observeDomainEvents/getSubscriptionOptions';
import { getSubscriptionResolvers } from './observeDomainEvents/getSubscriptionResolvers';
import { IdentityProvider } from 'limes';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { PublishDomainEvent } from '../../PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { stripIndent } from 'common-tags';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';
import { ApolloServer, gql } from 'apollo-server-express';

const getV2 = async function ({
  corsOrigin,
  applicationDefinition,
  identityProviders,
  handleCommand,
  observeDomainEvents,
  playground
}: {
  corsOrigin: CorsOrigin;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
  handleCommand: false | { onReceiveCommand: OnReceiveCommand };
  observeDomainEvents: false | { repository: Repository; webSocketEndpoint: string };
  playground: boolean;
}): Promise<{
    api: Application;
    graphqlServer: ApolloServer;
    publishDomainEvent?: PublishDomainEvent;
  }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: false }
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
    typeDefinitions += `${getHandleCommandTypeDefinitions({ applicationDefinition })}\n`;
    resolvers.Mutation = getMutationResolvers({
      applicationDefinition,
      onReceiveCommand: handleCommand.onReceiveCommand
    });
  }

  if (observeDomainEvents !== false) {
    const domainEventEmitter = new SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>();

    typeDefinitions += `${getObserveDomainEventsTypeDefinitions()}\n`;
    resolvers.Subscription = getSubscriptionResolvers({
      applicationDefinition,
      repository: observeDomainEvents.repository,
      domainEventEmitter
    });

    publishDomainEvent = function ({ domainEvent }): void {
      validateDomainEventWithState({ domainEvent, applicationDefinition });

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
        // If observeDomainEvents is true, the subscription options below will
        // add the clientMetadata to the connection context on WebSocket
        // connection.
        return connection.context;
      }

      return { clientMetadata: new ClientMetadata({ req }) };
    },
    subscriptions: observeDomainEvents !== false ?
      getSubscriptionOptions({
        identityProviders,
        webSocketEndpoint: observeDomainEvents.webSocketEndpoint
      }) :
      undefined,
    introspection: true,
    playground: playground ?
      {
        subscriptionEndpoint: observeDomainEvents !== false ?
          observeDomainEvents.webSocketEndpoint :
          undefined
      } :
      false
  });

  graphqlServer.applyMiddleware({ app: api });

  return { api, graphqlServer, publishDomainEvent };
};

export { getV2 };
