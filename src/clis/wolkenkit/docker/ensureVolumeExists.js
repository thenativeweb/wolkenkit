'use strict';

const map = require('lodash/map'),
      { oneLine } = require('common-tags');

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const ensureVolumeExists = async function ({ configuration, volume }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!volume) {
    throw new Error('Volume is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  const { stdout } = await shell.exec(`docker volume ls --format "{{json .}}"`, {
    env: environmentVariables
  });

  const volumes = stdout.
    split('\n').
    filter(item => item).
    map(item => JSON.parse(item));

  const doesVolumeExist = volumes.find(item => item.Name === volume.name);

  if (doesVolumeExist) {
    return;
  }

  await shell.exec(oneLine`
    docker volume create
    ${volume.labels ? map(volume.labels, (value, key) => `--label ${key}="${value}"`).join(' ') : ''}
    ${volume.name}
  `, {
    env: environmentVariables
  });
};

module.exports = ensureVolumeExists;
