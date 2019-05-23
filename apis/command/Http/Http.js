'use strict';

const bodyParser = require('body-parser'),
      cors = require('cors'),
      express = require('express'),
      flatten = require('lodash/flatten'),
      nocache = require('nocache');

const V2 = require('./V2');

class Http {
  async initialize ({
    corsOrigin,
    overwriteInitiatorAndClient,
    onReceiveCommand,
    application,
    identityProviders
  }) {
    if (!corsOrigin) {
      throw new Error('CORS origin is missing.');
    }
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

    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = flatten([ corsOrigin ]);
    }

    this.v2 = new V2({
      overwriteInitiatorAndClient,
      onReceiveCommand,
      application,
      identityProviders
    });

    this.api = express();

    this.api.options('*', cors({
      methods: [ 'GET', 'POST' ],
      origin: transformedCorsOrigin,
      optionsSuccessStatus: 200
    }));
    this.api.use(cors({
      methods: [ 'GET', 'POST' ],
      origin: transformedCorsOrigin,
      optionsSuccessStatus: 200
    }));

    this.api.use(nocache());
    this.api.use(bodyParser.json({ limit: '100kb' }));

    this.api.use('/v2', this.v2.api);
  }
}

module.exports = Http;
