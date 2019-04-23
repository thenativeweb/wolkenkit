'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const errors = require('../../errors');

const readdir = promisify(fs.readdir);

const getConnections = async function ({
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

  try {
    await readdir(pathRuntime);
  } catch (ex) {
    switch (ex.code) {
      case 'ENOENT':
        throw new errors.VersionNotFound();
      default:
        throw ex;
    }
  }

  /* eslint-disable global-require */
  const connections = require(path.join(pathRuntime, 'connections'));
  /* eslint-enable global-require */

  return connections({
    configuration,
    dangerouslyExposeHttpPorts,
    debug,
    persistData,
    sharedKey
  });
};

module.exports = getConnections;
