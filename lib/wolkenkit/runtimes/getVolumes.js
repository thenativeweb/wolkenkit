'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const errors = require('../../errors'),
      file = require('../../file');

const readdir = promisify(fs.readdir),
      stat = promisify(fs.stat);

const getVolumes = async function ({ configuration, forVersion, secret }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!forVersion) {
    throw new Error('Version is missing.');
  }
  if (!secret) {
    throw new Error('Secret is missing.');
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

  const volumes = (await Promise.all(entries.map(async entry => {
    const pathVolume = path.join(pathRuntime, entry);
    const isDirectory = (await stat(pathVolume)).isDirectory();

    if (!isDirectory) {
      return;
    }

    const pathVolumeFile = path.join(pathVolume, 'volume.js');

    if (!await file.exists(pathVolumeFile)) {
      return;
    }

    /* eslint-disable global-require */
    const volume = require(pathVolumeFile);
    /* eslint-enable global-require */

    return volume({ configuration, secret });
  }))).filter(volume => volume);

  return volumes;
};

module.exports = getVolumes;
