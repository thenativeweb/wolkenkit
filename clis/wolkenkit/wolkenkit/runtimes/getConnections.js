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
    secret
  });
};

module.exports = getConnections;
