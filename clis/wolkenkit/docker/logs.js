'use strict';

const combinedStream = require('combined-stream');

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const logs = async function ({
  configuration,
  containers,
  follow,
  passThrough = undefined
}) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!containers) {
    throw new Error('Containers are missing');
  }
  if (follow === undefined) {
    throw new Error('Follow is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  const containerNames = containers.map(container => container.name);

  const childProcesses = [];

  await Promise.all(containerNames.map(containerName => new Promise(resolve => {
    const args = [ 'logs', containerName ];

    if (follow) {
      args.push('--follow');
    }

    const child = shell.spawn('docker', args, {
      env: environmentVariables,
      stdio: 'pipe'
    });

    child.once('close', code => {
      if (code !== 0) {
        childProcesses.forEach(process => {
          process.kill();
        });

        /* eslint-disable unicorn/no-process-exit */
        process.exit(1);
        /* eslint-enable unicorn/no-process-exit */
      }
    });

    childProcesses.push(child);

    resolve();
  })));

  const multiStream = combinedStream.create();

  childProcesses.
    map(child => child.stdout).
    forEach(stream => multiStream.append(stream));

  const outputStream = passThrough || process.stdout;

  await new Promise((resolve, reject) => {
    multiStream.once('error', reject);
    multiStream.once('end', resolve);

    multiStream.pipe(outputStream);
  });
};

module.exports = logs;
