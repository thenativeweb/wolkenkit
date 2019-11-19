import { RequestHandler } from 'express';
import { IdentityProvider, Limes } from 'limes';

const getAuthenticationMiddleware = async function ({ identityProviders }: {
  identityProviders: IdentityProvider[];
}): Promise<RequestHandler> {
  const limes = new Limes({ identityProviders });

  const authenticationMiddleware = limes.verifyTokenMiddleware({
    // According to RFC 2606, .invalid is a reserved TLD you can use in cases
    // where you want to show that a domain is invalid. Since the tokens issued
    // for anonymous users are made-up, https://token.invalid makes up a valid
    // url, but we are sure that we do not run into any conflicts with the
    // domain.
    issuerForAnonymousTokens: 'https://token.invalid'
  });

  return authenticationMiddleware;
};

export { getAuthenticationMiddleware };
