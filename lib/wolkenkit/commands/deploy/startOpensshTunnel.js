'use strict';

const errors = require('../../../errors'),
      shell = require('../../../shell'),
      waitForSshTunnel = require('./waitForSshTunnel');

const startOpensshTunnel = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.addresses) {
    throw new Error('Addresses are missing.');
  }
  if (!options.username) {
    throw new Error('Username is missing.');
  }

  const { addresses, username } = options;

  if (!await shell.which('ssh')) {
    throw new errors.ExecutableNotFound();
  }

  const childProcess = await new Promise(async (resolve, reject) => {
    const child = shell.spawn(
      'ssh',
      [ '-nNT',
        `-L ${addresses.from.port}:${addresses.from.host}:${addresses.to.port}`,
        `${username}@${addresses.server.host}`,
        `-p ${addresses.server.port}` ],
      { stdio: 'pipe' }
    );

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
