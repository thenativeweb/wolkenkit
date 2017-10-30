'use strict';

const shell = require('../../../shell'),
      sleep = require('../../../sleep');

const startNativeSshTunnel = async function (options) {
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

  const childProcess = await new Promise(async (resolve, reject) => {
    const child = shell.spawn(
      'ssh',
      [ '-nNT',
        `-L ${addresses.from.port}:${addresses.from.host}:${addresses.to.port}`,
        `${username}@${addresses.server.host}`,
        `-p ${addresses.server.port}` ]
    );

    child.on('error', reject);

    await sleep(50);

    resolve(child);
  });

  return { close: () => childProcess.kill() };
};

module.exports = startNativeSshTunnel;
