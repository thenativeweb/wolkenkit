'use strict';

const express = require('express'),
      Limes = require('limes');

const getConfiguration = require('./getConfiguration'),
      postCommand = require('./postCommand');

class V2 {
  constructor ({
    overwriteInitiatorAndClient,
    onReceiveCommand,
    application,
    identityProviders
  }) {
    if (overwriteInitiatorAndClient === undefined) {
      throw new Error('Overwrite initiator and client is missing.');
    }
    if (!onReceiveCommand) {
      throw new Error('On receive command is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }
    if (!identityProviders) {
      throw new Error('Identity providers are missing.');
    }

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
      overwriteInitiatorAndClient,
      onReceiveCommand,
      application
    }));
  }
}

module.exports = V2;
