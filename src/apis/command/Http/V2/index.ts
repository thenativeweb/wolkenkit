import Application from '../../../../common/application/Application';
import express from 'express';
import { Express } from 'express-serve-static-core';
import getConfiguration from './getConfiguration';
import { IdentityProvider } from '../../../../../types/limes';
import Limes from 'limes';
import { Purpose } from '../../../shared/Purpose';
import postCommand, { OnReceiveCommand } from './postCommand';

class V2 {
  protected application: Application;

  public api: Express;

  public constructor ({
    purpose,
    onReceiveCommand,
    application,
    identityProviders
  }: {
    purpose: Purpose;
    onReceiveCommand: OnReceiveCommand;
    application: Application;
    identityProviders: IdentityProvider[];
  }) {
    this.application = application;

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

    this.api.get('/configuration', getConfiguration({ application }));

    this.api.post('/', verifyTokenMiddleware, postCommand({
      purpose,
      onReceiveCommand,
      application
    }));
  }
}

export default V2;
