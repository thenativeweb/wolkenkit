'use strict';

const cors = require('cors'),
      express = require('express'),
      flatten = require('lodash/flatten');

const V2 = require('./V2');

class Http {
  async initialize ({
    corsOrigin,
    addFileAuthorizationOptions,
    identityProviders,
    provider
  }) {
    if (!corsOrigin) {
      throw new Error('CORS origin is missing.');
    }
    if (!addFileAuthorizationOptions) {
      throw new Error('Add file authorization options are missing.');
    }
    if (!identityProviders) {
      throw new Error('Identity providers are missing.');
    }
    if (!provider) {
      throw new Error('Provider is missing.');
    }

    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = flatten([ corsOrigin ]);
    }

    this.v2 = new V2({ addFileAuthorizationOptions, identityProviders, provider });

    this.api = express();

    this.api.use(cors({
      origin: transformedCorsOrigin,
      allowedHeaders: [ 'content-type', 'authorization', 'x-metadata', 'x-to' ],
      exposedHeaders: [ 'content-length', 'content-type', 'content-disposition', 'x-metadata' ]
    }));

    this.api.use('/v2', this.v2.api);
  }
}

module.exports = Http;
