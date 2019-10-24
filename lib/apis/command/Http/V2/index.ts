import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { getDescription } from './getDescription';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { postCommand } from './postCommand';
import Limes, { IdentityProvider } from 'limes';

class V2 {
  public api: Express;

  protected applicationDefinition: ApplicationDefinition;

  public constructor ({
    onReceiveCommand,
    applicationDefinition,
    identityProviders
  }: {
    onReceiveCommand: OnReceiveCommand;
    applicationDefinition: ApplicationDefinition;
    identityProviders: IdentityProvider[];
  }) {
    this.applicationDefinition = applicationDefinition;

    const limes = new Limes({ identityProviders });
    const verifyTokenMiddleware = limes.verifyTokenMiddleware({
      // According to RFC 2606, .invalid is a reserved TLD you can use in cases
      // where you want to show that a domain is invalid. Since the tokens issued
      // for anonymous users are made-up, https://token.invalid makes up a valid
      // url, but we are sure that we do not run into any conflicts with the
      // domain.
      issuerForAnonymousTokens: 'https://token.invalid'
    });

    this.api = express();

    this.api.get('/description', getDescription({ applicationDefinition }));

    this.api.post('/', verifyTokenMiddleware, postCommand({
      onReceiveCommand,
      applicationDefinition
    }));
  }
}

export { V2 };
