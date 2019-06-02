'use strict';

const path = require('path');

const axios = require('axios'),
      retry = require('async-retry'),
      runfork = require('runfork');

const startProcess = async function ({ runtime, name, port, env = {}}) {
  if (!runtime) {
    throw new Error('Runtime is missing.');
  }
  if (!name) {
    throw new Error('Name is missing.');
  }
  if (!port) {
    throw new Error('Port is missing.');
  }

  const stopProcess = runfork({
    path: path.join(__dirname, '..', '..', '..', 'runtimes', runtime, 'processes', name, 'app.js'),
    env,
    silent: false
  });

  await retry(async () => {
    await axios({
      method: 'get',
      url: `http://localhost:${port}/health/v2`
    });
  });

  return stopProcess;
};

module.exports = startProcess;
