'use strict';

const axios = require('axios');

const network = require('../../../../network');

const attachDebugger = async function ({
  configuration,
  dangerouslyExposeHttpPorts,
  debug,
  secret
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (dangerouslyExposeHttpPorts === undefined) {
    throw new Error('Dangerously expose http ports is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!secret) {
    throw new Error('Secret is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const containers = await configuration.applicationContainers({
    dangerouslyExposeHttpPorts,
    debug,
    secret
  });

  const host = configuration.api.host.name;

  let addresses;

  try {
    addresses = await network.getIpAddresses(host);
  } catch (ex) {
    progress({ message: ex.message });
    progress({ message: `Failed to resolve ${host}.`, type: 'info' });

    throw ex;
  }

  for (const container of containers) {
    if (!container.ports) {
      continue;
    }

    /* eslint-disable prefer-destructuring */
    const debugPort = container.ports[9229];
    /* eslint-enable prefer-destructuring */

    if (!debugPort) {
      continue;
    }

    const response = await axios({
      method: 'get',
      url: `http://${addresses[0].address}:${debugPort}/json`
    });

    const [{ id }] = response.data;

    const debugUrl = `chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=${host}:${debugPort}/${id}`;

    progress({ message: `Started debugger for ${container.name} on ${debugUrl}.`, type: 'info' });
  }
};

module.exports = attachDebugger;
