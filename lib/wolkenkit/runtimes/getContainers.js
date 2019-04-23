'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const errors = require('../../errors'),
      getConnections = require('./getConnections');

const readdir = promisify(fs.readdir),
      stat = promisify(fs.stat);

const getContainers = async function ({
  configuration,
  dangerouslyExposeHttpPorts,
  debug,
  forVersion,
  persistData,
  sharedKey
}) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (dangerouslyExposeHttpPorts === undefined) {
    throw new Error('Dangerously expose http ports is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!forVersion) {
    throw new Error('Version is missing.');
  }
  if (persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }

  const pathRuntime = path.join(__dirname, '..', '..', 'configuration', forVersion);

  let entries;

  try {
    entries = await readdir(pathRuntime);
  } catch (ex) {
    switch (ex.code) {
      case 'ENOENT':
        throw new errors.VersionNotFound();
      default:
        throw ex;
    }
  }

  const containers = (await Promise.all(entries.map(async entry => {
    const pathContainer = path.join(pathRuntime, entry);
    const isDirectory = (await stat(pathContainer)).isDirectory();

    if (!isDirectory) {
      return;
    }

    /* eslint-disable global-require */
    const container = require(path.join(pathContainer, 'container'));
    /* eslint-enable global-require */

    const connections = await getConnections({
      configuration,
      dangerouslyExposeHttpPorts,
      debug,
      forVersion,
      persistData,
      sharedKey
    });

    return container({
      configuration,
      connections,
      dangerouslyExposeHttpPorts,
      debug,
      persistData,
      sharedKey
    });
  }))).filter(container => container);

  return containers;
};

module.exports = getContainers;
