import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { SubscriptionServerOptions } from 'apollo-server-core/src/types';
import { IdentityProvider, Limes } from 'limes';

const getSubscriptionOptions = function ({ identityProviders, webSocketEndpoint, issuerForAnonymousTokens }: {
  identityProviders: IdentityProvider[];
  webSocketEndpoint: string;
  issuerForAnonymousTokens: string;
}): SubscriptionServerOptions {
  const limes = new Limes({ identityProviders });

  return {
    async onConnect (
      connectionParams: any,
      webSocket
    ): Promise<ClientMetadata> {
      let clientMetadata: ClientMetadata;

      if (!connectionParams.token) {
        const payload = {
          [`${issuerForAnonymousTokens}/is-anonymous`]: true
        };
        let subject = 'anonymous';

        if (connectionParams['x-anonymous-id']) {
          subject += `-${connectionParams['x-anonymous-id']}`;
        }

        const anonymousToken = Limes.issueUntrustedToken({
          issuer: issuerForAnonymousTokens,
          subject,
          payload
        });

        clientMetadata = {
          token: anonymousToken.token,
          user: {
            id: anonymousToken.decodedToken!.sub,
            claims: anonymousToken.decodedToken!
          },
          ip: (webSocket as any).upgradeReq.connection.remoteAddress
        };
      } else {
        const claims = await limes.verifyToken({ token: connectionParams.token });

        clientMetadata = {
          token: connectionParams.token,
          user: {
            id: claims.sub,
            claims
          },
          ip: (webSocket as any).upgradeReq.connection.remoteAddress
        };
      }

      return clientMetadata;
    },
    path: webSocketEndpoint
  };
};

export { getSubscriptionOptions };
