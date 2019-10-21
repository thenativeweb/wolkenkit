'use strict';

const fs = require('fs'),
      path = require('path'),
      { promisify } = require('util');

const errors = require('../errors'),
      getConnections = require('./getConnections');

const readdir = promisify(fs.readdir),
      stat = promisify(fs.stat);

const getContainers = async function ({
  configuration,
  dangerouslyExposeHttpPorts,
  debug,
  forVersion,
  secret
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
  if (!secret) {
    throw new Error('Secret is missing.');
  }

  const pathRuntime = path.join(__dirname, '..', 'configuration', forVersion);

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
      secret
    });

    return container({
      configuration,
      connections,
      dangerouslyExposeHttpPorts,
      debug,
      secret
    });
  }))).filter(container => container);

  return containers;
};

module.exports = getContainers;
