import { ClientMetadata } from '../../../common/utils/http/ClientMetadata';
import { Context } from 'graphql-ws';
import http from 'http';
import { IdentityProvider, Limes } from 'limes';

const getHandleSubscriptionAuthorization = function ({ identityProviders, issuerForAnonymousTokens }: {
  identityProviders: IdentityProvider[];
  issuerForAnonymousTokens: string;
}): (context: Context<{ request: http.IncomingMessage }>) => Promise<{ clientMetadata: ClientMetadata }> {
  const limes = new Limes({ identityProviders });

  return async (context): Promise<{ clientMetadata: ClientMetadata }> => {
    let clientMetadata: ClientMetadata;

    const token = (context.extra.request.headers.token ?? context.connectionParams?.token) as string | undefined;
    const xAnonymousId = (context.extra.request.headers['x-anonymous-id'] ?? context.connectionParams?.['x-anonymous-id']) as string | undefined;
    const remoteAddress = context.extra.request.socket.remoteAddress ?? '0.0.0.0';

    if (!token) {
      const payload = {
        [`${issuerForAnonymousTokens}/is-anonymous`]: true
      };
      let subject = 'anonymous';

      if (xAnonymousId) {
        subject += `-${xAnonymousId}`;
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
        ip: remoteAddress
      };
    } else {
      const claims = await limes.verifyToken({ token });

      clientMetadata = {
        token,
        user: {
          id: claims.sub,
          claims
        },
        ip: remoteAddress
      };
    }

    return { clientMetadata };
  };
};

export { getHandleSubscriptionAuthorization };
