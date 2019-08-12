/* eslint-disable max-classes-per-file */
import { RequestHandler } from 'express-serve-static-core';

declare global {
  namespace Express {
    export interface Request {
      token?: string;
      user?: {
        id: string;
        claims: object | string;
      };
    }
  }
}

export class IdentityProvider {
  public constructor(args: {
    issuer: string;
    privateKey: Buffer;
    certificate: Buffer;
    expiresInMinutes?: number;
  });
}

declare class Limes {
  public constructor(args: { identityProviders: IdentityProvider[] });

  public getIdentityProviderByIssuer(args: {
    issuer: string;
  }): IdentityProvider;

  public issueToken(args: {
    issuer: string;
    subject: string;
    payload: {};
  }): string;

  public issueUntrustedToken(args: {
    issuer: string;
    subject: string;
    payload: {};
  }): {
    token: string;
    decodedToken: null | { [key: string]: any } | string;
  };

  public verifyToken(args: {
    token: string;
  }): Promise<object | string>;

  public verifyTokenMiddleware(args: {
    issuerForAnonymousTokens: string;
  }): RequestHandler

  public static IdentityProvider: new(args: {
    issuer: string;
    privateKey: Buffer;
    certificate: Buffer;
    expiresInMinutes?: number;
  }) => IdentityProvider;
}

export default Limes;
