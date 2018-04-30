'use strict';

const docker = require('../../../../docker'),
      noop = require('../../../../noop');

const removeContainers = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  const { configuration, env } = options;

  const existingContainers = await docker.getContainers({
    configuration,
    env,
    where: { label: { 'wolkenkit-application': configuration.application }}
  });

  const removedContainer = [];

  await Promise.all(existingContainers.map(async container => {
    await docker.removeContainer({ configuration, container, env });

    removedContainer.push(container);

    progress({ message: `Removed ${container.name} (${removedContainer.length}/${existingContainers.length}).`, type: 'info' });
  }));
};

module.exports = removeContainers;
