'use strict';

const fs = require('fs'),
      { PassThrough } = require('stream'),
      { promisify } = require('util');

const bodyParser = require('body-parser'),
      compression = require('compression'),
      cors = require('cors'),
      express = require('express'),
      flatten = require('lodash/flatten'),
      nocache = require('nocache');

const v2 = require('./v2');

const stat = promisify(fs.stat);

class Http {
  async initialize ({
    corsOrigin,
    application,
    identityProviders,
    heartbeatInterval = 90 * 1000,
    serveStatic
  }) {
    if (!corsOrigin) {
      throw new Error('CORS origin is missing.');
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

    const commandStream = new PassThrough({ objectMode: true });
    const eventStream = new PassThrough({ objectMode: true });

    this.commandStream = commandStream;
    this.eventStream = eventStream;

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

    this.api.use('/v2', v2({
      commandStream,
      eventStream,
      application,
      identityProviders,
      heartbeatInterval
    }));

    if (serveStatic) {
      let staticPath;

      try {
        /* eslint-disable no-sync */
        staticPath = await stat(serveStatic);
        /* eslint-enble no-sync */
      } catch (ex) {
        throw new Error('Serve static is an invalid path.');
      }

      if (!staticPath.isDirectory()) {
        throw new Error('Serve static is not a directory.');
      }

      this.api.use(compression());
      this.api.use('/', express.static(serveStatic));
    }
  }
}

module.exports = Http;
