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
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { privateKey, server } = options;

  const serverUrl = url.parse(server);

  if (serverUrl.protocol !== 'ssh:') {
    progress({ message: 'Protocol is invalid.' });
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

  let tunnelServer;

  try {
    tunnelServer = await tunnelAsync({
      username: 'wolkenkit@wolkenkit.io',
      host: addresses.server.host,
      port: addresses.server.port,
      dstHost: addresses.to.host,
      dstPort: addresses.to.port,
      localHost: addresses.from.host,
      localPort: addresses.from.port,
      privateKey,
      keepAlive: true
    });
  } catch (ex) {
    progress({ message: 'Failed to open SSH tunnel.', type: 'info' });
    throw ex;
  }

  tunnelServer.on('error', err => {
    if (err.code === 'ECONNREFUSED') {
      progress({ message: 'Failed to reach SSH server.', type: 'info' });
    } else if (err.message === 'All configured authentication methods failed') {
      progress({ message: 'Failed to authenticate user.', type: 'info' });
    } else {
      progress({ message: 'Unexpected SSH tunnel error.', type: 'info' });
    }
    progress({ message: 'Failed to deploy application.', type: 'error' });

    throw err;
  });

  progress({ message: `Opened SSH tunnel from ${addresses.from.host}:${addresses.from.port} to ${addresses.server.host}:${addresses.server.port}.` });

  return { close: () => tunnelServer.close(), host: addresses.from.host, port: addresses.from.port, server: addresses.server };
};

module.exports = startTunnel;
