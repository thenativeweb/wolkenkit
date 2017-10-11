'use strict';

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const logs = async function (options) {
  if (!options) {
    throw new Error('Options are missing');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.containers) {
    throw new Error('Containers are missing');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (options.follow === undefined) {
    throw new Error('Follow is missing.');
  }

  const { configuration, containers, env, follow } = options;

  const environmentVariables = await getEnvironmentVariables({ configuration, env });

  const containerNames = containers.map(container => container.name);

  const childProcesses = [];

  await Promise.all(containerNames.map(containerName => new Promise(resolve => {
    const args = [ 'logs', containerName ];

    if (follow) {
      args.push('--follow');
    }

    const child = shell.spawn('docker', args, { env: environmentVariables, stdio: 'inherit' });

    child.on('close', code => {
      if (code !== 0) {
        childProcesses.forEach(process => {
          process.kill();
        });

        /* eslint-disable no-process-exit */
        process.exit(1);
        /* eslint-enable no-process-exit */
      }

      resolve();
    });

    childProcesses.push(child);
  })));
};

module.exports = logs;
