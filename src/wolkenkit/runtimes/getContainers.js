'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const errors = require('../../errors');

const readdir = promisify(fs.readdir),
      stat = promisify(fs.stat);

const getContainers = async function ({
  forVersion,
  configuration,
  env,
  sharedKey,
  persistData,
  dangerouslyExposeHttpPort,
  debug
}) {
  if (!forVersion) {
    throw new Error('Version is missing.');
  }
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (dangerouslyExposeHttpPort === undefined) {
    throw new Error('Dangerously expose http port is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
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

    return container({
      configuration,
      env,
      sharedKey,
      persistData,
      dangerouslyExposeHttpPort,
      debug
    });
  }))).filter(container => container);

  return containers;
};

module.exports = getContainers;
