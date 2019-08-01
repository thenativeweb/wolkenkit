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
    purpose,
    onReceiveCommand,
    application,
    identityProviders
  }) {
    if (!corsOrigin) {
      throw new Error('Cors origin is missing.');
    }
    if (!purpose) {
      throw new Error('Purpose is missing.');
    }
    if (!onReceiveCommand) {
      throw new Error('On receive command is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }
    if (!identityProviders) {
      throw new Error('Identity providers is missing.');
    }

    if (![ 'internal', 'external' ].includes(purpose)) {
      throw new Error(`Purpose must either be 'internal' or 'external'.`);
    }

    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = flatten([ corsOrigin ]);
    }

    this.v2 = new V2({
      purpose,
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
