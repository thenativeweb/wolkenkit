'use strict';

const bodyParser = require('body-parser'),
      cors = require('cors'),
      express = require('express'),
      flatten = require('lodash/flatten'),
      nocache = require('nocache');

const { EventInternal } = require('../../../common/elements'),
      V2 = require('./V2');

class Http {
  async initialize ({
    corsOrigin,
    purpose,
    onReceiveEvent,
    application,
    repository,
    identityProviders,
    heartbeatInterval = 90 * 1000
  }) {
    if (!corsOrigin) {
      throw new Error('CORS origin is missing.');
    }
    if (!purpose) {
      throw new Error('Purpose is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }
    if (!repository) {
      throw new Error('Repository is missing.');
    }
    if (!identityProviders) {
      throw new Error('Identity providers are missing.');
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

    this.purpose = purpose;

    this.v2 = new V2({
      purpose,
      onReceiveEvent,
      application,
      repository,
      identityProviders,
      heartbeatInterval
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

  async sendEvent ({ event }) {
    if (!event) {
      throw new Error('Event is missing.');
    }
    if (!(event instanceof EventInternal)) {
      throw new Error('Event must be internal.');
    }

    if (this.purpose !== 'external') {
      throw new Error('Invalid operation.');
    }

    await this.v2.sendEvent({ event });
  }
}

module.exports = Http;
