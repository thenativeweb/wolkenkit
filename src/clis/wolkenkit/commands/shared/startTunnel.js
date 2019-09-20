'use strict';

const os = require('os'),
      url = require('url');

const freeport = require('freeport-promise');

const defaults = require('../defaults.json'),
      errors = require('../../errors'),
      file = require('../../file'),
      startOpensshTunnel = require('./startOpensshTunnel'),
      startPuttyTunnel = require('./startPuttyTunnel');

const startTunnel = async function ({
  configuration,
  privateKey = undefined
}, progress) {
  if (!configuration) {
    throw new Error('configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { type, deployment } = configuration;

  if (type !== 'aufwind') {
    progress({ message: 'Environment is not of type aufwind.', type: 'info' });
    throw new errors.EnvironmentNotAufwind();
  }

  let server = `ssh://${defaults.commands.shared.aufwind.ssh.host}:${defaults.commands.shared.aufwind.ssh.port} `;

  if (deployment.server) {
    server = `ssh://${deployment.server.host}:${deployment.server.port}`;
  }

  if (privateKey) {
    try {
      await file.read(privateKey);
    } catch (ex) {
      switch (ex.code) {
        case 'EFILENOTFOUND':
          progress({ message: 'Private key not found.', type: 'info' });
          break;
        case 'EFILENOTACCESSIBLE':
          progress({ message: 'Private key is not accessible.', type: 'info' });
          break;
        default:
          break;
      }

      throw ex;
    }

    const stats = await file.stat(privateKey);
    const mode = stats.mode.toString(8);

    if (/^\d\d\d(?<ownerPermission>4|6)00$/ug.test(mode) === false) {
      progress({ message: 'Private key permissions are too open.', type: 'info' });

      throw new errors.FileAccessModeTooOpen();
    }
  }

  const serverUrl = url.parse(server);

  if (serverUrl.protocol !== 'ssh:') {
    progress({ message: 'Protocol is invalid.' });
    throw new errors.ProtocolInvalid();
  }

  const username = 'wolkenkit';
  const addresses = {
    server: {
      host: serverUrl.hostname,
      port: serverUrl.port
    },
    from: {
      host: 'localhost',
      port: await freeport()
    },
    to: {
      host: defaults.commands.shared.aufwind.http.host,
      port: defaults.commands.shared.aufwind.http.port
    }
  };

  let tunnelServer;

  if (os.platform() === 'win32') {
    progress({ message: 'Trying to use plink...' });

    try {
      tunnelServer = await startPuttyTunnel({
        addresses,
        configuration,
        privateKey,
        username
      });
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
      tunnelServer = await startOpensshTunnel({
        addresses,
        configuration,
        privateKey,
        username
      });
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

  return {
    close () {
      tunnelServer.close();
      progress({ message: 'Closed SSH tunnel.' });
    },
    host: addresses.from.host,
    port: addresses.from.port,
    server: addresses.server
  };
};

module.exports = startTunnel;
