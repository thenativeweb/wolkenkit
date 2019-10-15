'use strict';

const http = require('http');

const bodyParser = require('body-parser'),
      cors = require('cors'),
      express = require('express'),
      flaschenpost = require('flaschenpost');

const logger = flaschenpost.getLogger();

const startCatchAllServer = async function ({ port, onRequest, parseJson = true }) {
  if (!port) {
    throw new Error('Port is missing.');
  }
  if (!onRequest) {
    throw new Error('On request is missing.');
  }

  const app = express();

  app.use(cors());

  if (parseJson) {
    app.use(bodyParser.json());
  }

  app.all('*', onRequest);

  const server = http.createServer(app);

  await new Promise(resolve => {
    server.listen(port, () => {
      logger.info('Catch all server started.', { port });
      resolve();
    });
  });
};

module.exports = startCatchAllServer;
