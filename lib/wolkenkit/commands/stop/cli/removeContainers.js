'use strict';

const docker = require('../../../../docker');

const removeContainers = async function ({ configuration }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const existingContainers = await docker.getContainers({
    configuration,
    where: { label: { 'wolkenkit-application': configuration.application.name }}
  });

  const removedContainer = [];

  await Promise.all(existingContainers.map(async container => {
    await docker.removeContainer({ configuration, container });

    removedContainer.push(container);

    progress({ message: `Removed ${container.name} (${removedContainer.length}/${existingContainers.length}).`, type: 'info' });
  }));
};

module.exports = removeContainers;
