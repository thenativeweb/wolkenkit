'use strict';

const fs = require('fs'),
      { promisify } = require('util');

const compression = require('compression'),
      cors = require('cors'),
      express = require('express'),
      flatten = require('lodash/flatten'),
      nocache = require('nocache');

const stat = promisify(fs.stat);

class Http {
  async initialize ({ corsOrigin, serveStatic }) {
    if (!corsOrigin) {
      throw new Error('CORS origin is missing.');
    }
    if (!serveStatic) {
      throw new Error('Serve static is missing.');
    }

    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = flatten([ corsOrigin ]);
    }

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

    let staticPath;

    try {
      /* eslint-disable no-sync */
      staticPath = await stat(serveStatic);
      /* eslint-enble no-sync */
    } catch {
      throw new Error('Serve static is an invalid path.');
    }

    if (!staticPath.isDirectory()) {
      throw new Error('Serve static is not a directory.');
    }

    this.api.use(compression());
    this.api.use('/', express.static(serveStatic));
  }
}

module.exports = Http;
