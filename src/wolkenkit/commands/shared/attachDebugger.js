'use strict';

const axios = require('axios');

const runtimes = require('../../runtimes');

const attachDebugger = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (options.persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (options.debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { configuration, env, sharedKey, persistData, debug } = options;

  const host = configuration.environments[env].api.address.host,
        runtime = configuration.runtime.version;

  const containers = await runtimes.getContainers({
    forVersion: runtime,
    configuration,
    env,
    sharedKey,
    persistData,
    debug
  });

  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];

    if (!container.ports) {
      continue;
    }

    const debugPort = container.ports[9229];

    if (!debugPort) {
      continue;
    }

    const response = await axios({
      method: 'get',
      url: `http://${host}:${debugPort}/json`
    });

    const { id } = response.data[0];

    const debugUrl = `chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=${host}:${debugPort}/${id}`;

    progress({ message: `Started debugger for ${container.name} on ${debugUrl}.`, type: 'info' });
  }
};

module.exports = attachDebugger;
