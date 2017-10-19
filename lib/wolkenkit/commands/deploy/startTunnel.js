'use strict';

const url = require('url');

const tunnel = require('tunnel-ssh');

const startTunnel = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.privateKey) {
    throw new Error('Server is missing.');
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
  const addresses = {
    server: {
      host: 'localhost',
      port: 6000
    },
    from: {
      host: serverUrl.hostname,
      port: serverUrl.port
    },
    to: {
      host: 'localhost',
      port: 5000
    }
  };

  const tunnelServer = await new Promise((resolve, reject) => {
    tunnel({
      username,
      host: addresses.server.host,
      port: addresses.server.port,
      dstHost: addresses.to.host,
      dstPort: addresses.to.port,
      localHost: addresses.from.host,
      localPort: addresses.from.port,
      privateKey,
      keepAlive: true
    },
    (err, tnlServer) => {
      if (err) {
        return reject(err);
      }

      resolve(tnlServer);
    });
  });

  tunnelServer.on('error', err => {
    throw err;
  });

  progress({ message: `SSH-Tunnel started on ${addresses.from.host}:${addresses.from.port}.` });

  return tunnelServer;
};

module.exports = startTunnel;
