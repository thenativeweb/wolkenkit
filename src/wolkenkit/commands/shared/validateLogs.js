'use strict';

const EventEmitter = require('events'),
      { promisify } = require('util');

const { Parser } = require('newline-json');

const docker = require('../../../docker'),
      errors = require('../../../errors');

const sleep = promisify(setTimeout);

const validateLogs = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { configuration, env } = options;

  const containers = await docker.getContainers({
    configuration,
    env,
    where: { label: { 'wolkenkit-application': configuration.application, 'wolkenkit-type': 'application' }}
  });

  progress({ message: 'Validating container logs...', type: 'info' });

  const validate = new EventEmitter();

  let isStopped = false;

  validate.once('stop', () => {
    isStopped = true;
  });

  (async () => {
    while (!isStopped) {
      try {
        await new Promise(async (resolve, reject) => {
          const passThrough = new Parser();

          passThrough.on('data', logMessage => {
            if (logMessage.level === 'fatal') {
              let message = 'Fatal runtime error happened.';

              if (logMessage.metadata && logMessage.metadata.err) {
                message = logMessage.metadata.err.message;
              }

              const err = new errors.RuntimeError(message);

              err.logMessage = logMessage;

              return reject(err);
            }
          });

          passThrough.on('end', resolve);

          await docker.logs({ configuration, containers, env, follow: false, passThrough });
        });
      } catch (ex) {
        isStopped = true;

        validate.emit('error', ex);
      }

      await sleep(250);
    }
  })();

  return validate;
};

module.exports = validateLogs;
