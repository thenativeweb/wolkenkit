'use strict';

const url = require('url'),
      util = require('util');

const freeport = require('freeport'),
      tunnel = require('tunnel-ssh');

const defaults = require('../../defaults.json'),
      errors = require('../../../errors');

const freeportAsync = util.promisify(freeport),
      tunnelAsync = util.promisify(tunnel);

const startTunnel = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.privateKey) {
    throw new Error('Private key is missing.');
  }
  if (!options.server) {
    throw new Error('Server is missing.');
  }
  if (!options.username) {
    throw new Error('Username is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { privateKey, server, username } = options;

  const serverUrl = url.parse(server);

  if (serverUrl.protocol !== 'ssh:') {
    throw new errors.ProtocolInvalid();
  }

  const addresses = {
    server: {
      host: serverUrl.hostname,
      port: serverUrl.port
    },
    from: {
      host: 'localhost',
      port: await freeportAsync()
    },
    to: {
      host: defaults.commands.deploy.aufwind.host,
      port: defaults.commands.deploy.aufwind.port
    }
  };

  const tunnelServer = await tunnelAsync({
    username,
    host: addresses.server.host,
    port: addresses.server.port,
    dstHost: addresses.to.host,
    dstPort: addresses.to.port,
    localHost: addresses.from.host,
    localPort: addresses.from.port,
    privateKey,
    keepAlive: true
  });

  tunnelServer.on('error', err => {
    throw err;
  });

  progress({ message: `SSH-Tunnel started on ${addresses.from.host}:${addresses.from.port}.` });

  return { close: () => tunnelServer.close(), host: addresses.from.host, port: addresses.from.port };
};

module.exports = startTunnel;
