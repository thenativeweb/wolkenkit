'use strict';

const path = require('path');

const axios = require('axios'),
      retry = require('async-retry'),
      runfork = require('runfork');

const startServer = async function ({ name, port, env = {}}) {
  if (!name) {
    throw new Error('Name is missing.');
  }
  if (!port) {
    throw new Error('Port is missing.');
  }

  const stopServer = runfork({
    path: path.join(__dirname, '..', '..', '..', 'servers', name, 'app.js'),
    env,
    silent: false
  });

  await retry(async () => {
    await axios({
      method: 'get',
      url: `http://localhost:${port}/health/v2`
    });
  });

  return stopServer;
};

module.exports = startServer;
