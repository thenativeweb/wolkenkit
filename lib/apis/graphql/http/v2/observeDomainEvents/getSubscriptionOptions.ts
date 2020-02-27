import { ClientMetadata } from '../../../../../common/utils/http/ClientMetadata';
import { SubscriptionServerOptions } from 'apollo-server-core/src/types';
import { IdentityProvider, Limes } from 'limes';

const getSubscriptionOptions = function ({ identityProviders, webSocketEndpoint }: {
  identityProviders: IdentityProvider[];
  webSocketEndpoint: string;
}): SubscriptionServerOptions {
  const limes = new Limes({ identityProviders });

  return {
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
    path: webSocketEndpoint
  };
};

export { getSubscriptionOptions };
