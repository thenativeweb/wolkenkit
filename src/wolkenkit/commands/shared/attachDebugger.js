'use strict';

const axios = require('axios');

const network = require('../../../network'),
      runtimes = require('../../runtimes');

const attachDebugger = async function ({
  configuration,
  env,
  sharedKey,
  persistData,
  dangerouslyExposeHttpPorts,
  debug
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (dangerouslyExposeHttpPorts === undefined) {
    throw new Error('Dangerously expose http ports is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const host = configuration.environments[env].api.address.host,
        runtime = configuration.runtime.version;

  const containers = await runtimes.getContainers({
    forVersion: runtime,
    configuration,
    env,
    sharedKey,
    persistData,
    dangerouslyExposeHttpPorts,
    debug
  });

  let addresses;

  try {
    addresses = await network.getIpAddresses(host);
  } catch (ex) {
    progress({ message: ex.message });
    progress({ message: `Failed to resolve ${host}.`, type: 'info' });

    throw ex;
  }

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
      url: `http://${addresses[0].address}:${debugPort}/json`
    });

    const { id } = response.data[0];

    const debugUrl = `chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=${host}:${debugPort}/${id}`;

    progress({ message: `Started debugger for ${container.name} on ${debugUrl}.`, type: 'info' });
  }
};

module.exports = attachDebugger;
