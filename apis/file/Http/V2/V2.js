'use strict';

const express = require('express'),
      Limes = require('limes');

const getFile = require('./getFile'),
      postAddFile = require('./postAddFile'),
      postAuthorize = require('./postAuthorize'),
      postRemoveFile = require('./postRemoveFile'),
      postTransferOwnership = require('./postTransferOwnership');

class V2 {
  constructor ({ addFileAuthorizationOptions, identityProviders, provider }) {
    if (!addFileAuthorizationOptions) {
      throw new Error('Add file authorization options are missing.');
    }
    if (!identityProviders) {
      throw new Error('Identity providers are missing.');
    }
    if (!provider) {
      throw new Error('Provider is missing.');
    }

    this.api = express();

    const limes = new Limes({ identityProviders });
    const verifyTokenMiddleware = limes.verifyTokenMiddleware({
      // According to RFC 2606, .invalid is a reserved TLD you can use in cases
      // where you want to show that a domain is invalid. Since the tokens issued
      // for anonymous users are made-up, https://token.invalid makes up a valid
      // url, but we are sure that we do not run into any conflicts with the
      // domain.
      issuerForAnonymousTokens: 'https://token.invalid'
    });

    this.api.get('/file/:id', verifyTokenMiddleware, getFile({ provider }));

    this.api.post('/add-file', verifyTokenMiddleware, postAddFile({ addFileAuthorizationOptions, provider }));
    this.api.post('/remove-file', verifyTokenMiddleware, postRemoveFile({ provider }));
    this.api.post('/transfer-ownership', verifyTokenMiddleware, postTransferOwnership({ provider }));
    this.api.post('/authorize', verifyTokenMiddleware, postAuthorize({ provider }));
  }
}

module.exports = V2;
