'use strict';

const os = require('os'),
      url = require('url'),
      util = require('util');

const freeport = require('freeport');

const defaults = require('../../defaults.json'),
      errors = require('../../../errors'),
      startOpensshTunnel = require('./startOpensshTunnel'),
      startPuttyTunnel = require('./startPuttyTunnel');

const freeportAsync = util.promisify(freeport);

const startTunnel = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.server) {
    throw new Error('Server is missing.');
  }
  if (!options.username) {
    throw new Error('Server is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { server, username } = options;

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

  if (os.platform() === 'win32') {
    progress({ message: 'Trying to use plink...' });

    try {
      tunnelServer = await startPuttyTunnel({ addresses, username });
    } catch (ex) {
      if (ex.code !== 'EEXECUTABLENOTFOUND') {
        switch (ex.code) {
          case 'ECONNREFUSED':
            progress({ message: 'Failed to reach aufwind server.', type: 'info' });
            break;
          default:
            break;
        }

        throw ex;
      }

      progress({ message: 'plink not found.' });
    }
  }

  if (!tunnelServer) {
    progress({ message: 'Trying to use ssh...' });

    try {
      tunnelServer = await startOpensshTunnel({ addresses, username });
    } catch (ex) {
      switch (ex.code) {
        case 'EEXECUTABLENOTFOUND':
          progress({ message: 'ssh not found.' });
          progress({ message: 'SSH client not found.', type: 'info' });
          break;
        case 'ECONNREFUSED':
          progress({ message: 'Failed to reach aufwind server.', type: 'info' });
          break;
        default:
          break;
      }

      throw ex;
    }
  }

  progress({ message: `Opened SSH tunnel from ${addresses.from.host}:${addresses.from.port} to ${addresses.server.host}:${addresses.server.port}.` });

  return { close: () => tunnelServer.close(), host: addresses.from.host, port: addresses.from.port, server: addresses.server };
};

module.exports = startTunnel;
