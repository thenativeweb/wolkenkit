'use strict';

const cors = require('cors'),
      express = require('express'),
      flatten = require('lodash/flatten'),
      nocache = require('nocache');

const V2 = require('./V2');

class Http {
  async initialize ({ corsOrigin, processId }) {
    if (!corsOrigin) {
      throw new Error('CORS origin is missing.');
    }
    if (!processId) {
      throw new Error('Process id is missing.');
    }

    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = flatten([ corsOrigin ]);
    }

    this.v2 = new V2({ processId });

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
    this.api.use('/v2', this.v2.api);
  }
}

module.exports = Http;
