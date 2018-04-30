'use strict';

const map = require('lodash/map'),
      { oneLine } = require('common-tags');

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const startContainer = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.container) {
    throw new Error('Container is missing.');
  }

  const { configuration, env, container } = options;

  const environmentVariables = await getEnvironmentVariables({ configuration, env });

  await shell.exec(oneLine`
    docker run
      --detach
      ${container.env ? map(container.env, (value, key) => `--env ${key}="${value}"`).join(' ') : ''}
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
