'use strict';

const docker = require('../../../docker');

const removeContainers = async function ({ configuration }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Environment is missing.');
  }

  const existingContainers = await docker.getContainers({
    configuration,
    where: { label: { 'wolkenkit-application': configuration.application.name }}
  });

  const applicationContainers = existingContainers.
    filter(container => container.labels['wolkenkit-type'] === 'application');

  const removedContainer = [];

  await Promise.all(applicationContainers.map(async container => {
    await docker.removeContainer({ configuration, container });

    removedContainer.push(container);

    progress({ message: `Removed ${container.name} (${removedContainer.length}/${applicationContainers.length}).`, type: 'info' });
  }));
};

module.exports = removeContainers;
