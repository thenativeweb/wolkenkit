'use strict';

const map = require('lodash/map'),
      { oneLine } = require('common-tags');

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const escapeAsJson = function (value) {
  if (value === undefined) {
    throw new Error('Value is missing.');
  }

  if (typeof value !== 'object') {
    return value;
  }

  const escapedValue = JSON.stringify(JSON.stringify(value)).slice(1, -1);

  return escapedValue;
};

const startContainer = async function ({ configuration, container }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!container) {
    throw new Error('Container is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  await shell.exec(oneLine`
    docker run
      --detach
      ${container.env ? map(container.env, (value, key) => `--env ${key}="${escapeAsJson(value)}"`).join(' ') : ''}
      ${container.labels ? map(container.labels, (value, key) => `--label ${key}="${value}"`).join(' ') : ''}
      ${container.networks ? map(container.networks, network => `--network "${network}"`).join(' ') : ''}
      ${container.networkAlias ? `--network-alias "${container.networkAlias}"` : ''}
      ${container.ports ? map(container.ports, (portHost, portContainer) => `--publish ${portHost}:${portContainer}`).join(' ') : ''}
      ${container.restart ? `--restart "${container.restart}"` : ''}
      ${container.volumes ? map(container.volumes, volume => `--volume "${volume}"`).join(' ') : ''}
      ${container.volumesFrom ? map(container.volumesFrom, volumeFrom => `--volumes-from "${volumeFrom}"`).join(' ') : ''}
      --name "${container.name}"
      ${container.image}
      ${container.cmd ? container.cmd : ''}
  `, {
    env: environmentVariables
  });
};

module.exports = startContainer;
