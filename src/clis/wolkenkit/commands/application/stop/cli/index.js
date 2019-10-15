'use strict';

const docker = require('../../../../docker'),
      errors = require('../../../../errors'),
      health = require('../../../health'),
      shared = require('../../../shared');

const cli = async function ({
  configuration,
  directory,
  env
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  await shared.checkDocker({ configuration }, progress);

  progress({ message: `Verifying health on environment ${env}...`, type: 'info' });
  await health({ directory, env }, progress);

  progress({ message: 'Verifying application status...', type: 'info' });
  const existingApplicationContainers = await docker.getContainers({
    configuration,
    where: {
      label: {
        'wolkenkit-application': configuration.application.name,
        'wolkenkit-type': 'application'
      }
    }
  });

  // We can not use the application status here, because for that we need to
  // fetch the labels of the containers. So this would be a chicken-and-egg
  // problem, hence this workaround.
  if (existingApplicationContainers.length === 0) {
    progress({ message: `The application is not running.`, type: 'info' });
    throw new errors.ApplicationNotRunning();
  }

  const dangerouslyExposeHttpPorts = existingApplicationContainers[0].labels['wolkenkit-dangerously-expose-http-ports'] === 'true',
        debug = existingApplicationContainers[0].labels['wolkenkit-debug'] === 'true',
        secret = existingApplicationContainers[0].labels['wolkenkit-secret'];

  const applicationStatus = await shared.getApplicationStatus({
    configuration,
    dangerouslyExposeHttpPorts,
    debug,
    secret
  }, progress);

  if (applicationStatus === 'partially-running') {
    progress({ message: `The application is partially running.`, type: 'info' });
  }

  progress({ message: `Removing Docker containers...`, type: 'info' });
  await shared.removeContainers({ configuration, containers: existingApplicationContainers }, progress);
};

module.exports = cli;
