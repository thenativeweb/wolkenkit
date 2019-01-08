'use strict';

const errors = require('../../../errors'),
      shell = require('../../../shell'),
      waitForSshTunnel = require('./waitForSshTunnel');

const startOpensshTunnel = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.addresses) {
    throw new Error('Addresses are missing.');
  }
  if (!options.username) {
    throw new Error('Username is missing.');
  }

  const { configuration, addresses, username, privateKey } = options;

  if (!await shell.which('ssh')) {
    throw new errors.ExecutableNotFound();
  }

  const childProcess = await new Promise(async (resolve, reject) => {
    const args = [
      '-nNT',
      '-L',
      `${addresses.from.port}:${addresses.from.host}:${addresses.to.port}`,
      `${username}@${addresses.server.host}`,
      '-p',
      `${addresses.server.port}`
    ];

    if (privateKey) {
      args.push('-i');
      args.push(privateKey);
    }

    const child = shell.spawn('ssh', args, { stdio: 'pipe' });

    child.on('error', reject);

    try {
      await waitForSshTunnel({ host: addresses.from.host, port: addresses.from.port });
    } catch (ex) {
      return reject(ex);
    }

    resolve(child);
  });

  return { close: () => childProcess.kill() };
};

module.exports = startOpensshTunnel;
