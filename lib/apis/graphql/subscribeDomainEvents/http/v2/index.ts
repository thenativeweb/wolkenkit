import { Application } from 'express';
import { ApplicationDefinition } from '../../../../../common/application/ApplicationDefinition';
import { ClientMetadata } from '../../../../../common/utils/http/ClientMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEvent } from '../../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../../common/elements/DomainEventWithState';
import { getAggregatesService } from '../../../../../common/services/getAggregatesService';
import { getApiBase } from '../../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../../base/getAuthenticationMiddleware';
import { getClientService } from '../../../../../common/services/getClientService';
import { getLoggerService } from '../../../../../common/services/getLoggerService';
import { getTypeDefinitions } from './getTypeDefinitions';
import { prepareForPublication } from '../../../../../common/domain/domainEvent/prepareForPublication';
import { PublishDomainEvent } from '../../PublishDomainEvent';
import { Repository } from '../../../../../common/domain/Repository';
import { SpecializedEventEmitter } from '../../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../../common/elements/State';
import { transformDomainEventForGraphql } from '../../../shared/elements/transformDomainEventForGraphql';
import { validateDomainEventWithState } from '../../../../../common/validators/validateDomainEventWithState';
import { ApolloServer, gql } from 'apollo-server-express';
import { IdentityProvider, Limes } from 'limes';

const getV2 = async function ({
  corsOrigin,
  applicationDefinition,
  repository,
  identityProviders
}: {
  corsOrigin: CorsOrigin;
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
  identityProviders: IdentityProvider[];
}): Promise<{
    api: Application;
    graphqlServer: ApolloServer;
    publishDomainEvent: PublishDomainEvent;
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

  const aggregatesService = getAggregatesService({ applicationDefinition, repository }),
        domainEventEmitter = new SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>(),
        limes = new Limes({ identityProviders }),
        typeDefinitions = getTypeDefinitions();

  const graphqlServer = new ApolloServer({
    typeDefs: gql(typeDefinitions),
    subscriptions: {
      async onConnect (
        connectionParams,
        webSocket
      ): Promise<ClientMetadata> {
        const authenticationResult = await limes.verifyTokenInWebsocketUpgradeRequest({
          issuerForAnonymousTokens: 'https://token.invalid',
          upgradeRequest: (webSocket as any).upgradeReq
        });

        return {
          token: authenticationResult.token,
          user: authenticationResult.user,
          ip: (webSocket as any).upgradeReq.connection.remoteAddress
        };
      },
      path: '/graphql/v2/graphql/'
    },
    resolvers: {
      Subscription: {
        domainEvents: {
          subscribe: (): AsyncIterator<DomainEvent<DomainEventData>[]> => domainEventEmitter.asyncIterator(),
          async resolve (
            domainEvents: DomainEvent<DomainEventData>[],
            _args,
            context: ClientMetadata
          ): Promise<any> {
            const domainEvent: any = domainEvents[0];

            const clientService = getClientService({ clientMetadata: context });

            const preparedDomainEvent = await prepareForPublication({
              applicationDefinition,
              domainEventWithState: domainEvent,
              domainEventFilter: {}, // TODO: get this from the subscription
              repository,
              services: {
                aggregates: aggregatesService,
                client: clientService,
                logger: getLoggerService({
                  fileName: `<app>/server/domain/${domainEvent.contextIdentifier.name}/${domainEvent.aggregateIdentifier.name}/`,
                  packageManifest: applicationDefinition.packageManifest
                })
              }
            });

            if (!preparedDomainEvent) {
              return null;
            }

            return transformDomainEventForGraphql({
              domainEvent: preparedDomainEvent
            });
          }
        }
      }
    },
    context ({
      connection
    }): undefined | ClientMetadata {
      if (connection) {
        return connection.context;
      }
    },
    introspection: true,
    playground: {
      subscriptionEndpoint: 'ws://localhost:3000/graphql/v2/graphql/'
    }
  });

  graphqlServer.applyMiddleware({ app: api });

  const publishDomainEvent: PublishDomainEvent = function ({ domainEvent }): void {
    validateDomainEventWithState({ domainEvent, applicationDefinition });

    domainEventEmitter.emit(domainEvent);
  };

  return { api, graphqlServer, publishDomainEvent };
};

export { getV2 };
