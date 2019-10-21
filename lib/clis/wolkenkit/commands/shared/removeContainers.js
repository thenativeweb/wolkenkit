'use strict';

const docker = require('../../docker');

const removeContainers = async function ({ configuration, containers }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!containers) {
    throw new Error('Containers are missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const removedContainer = [];

  await Promise.all(containers.map(async container => {
    await docker.removeContainer({ configuration, container });

    removedContainer.push(container);

    progress({ message: `Removed ${container.name} (${removedContainer.length}/${containers.length}).`, type: 'info' });
  }));
};

module.exports = removeContainers;
