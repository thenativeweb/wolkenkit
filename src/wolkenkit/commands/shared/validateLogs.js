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

          let unsubscribe;

          const onData = logMessage => {
            if (logMessage.level === 'fatal') {
              let orginalError = null;

              if (logMessage.metadata) {
                orginalError = logMessage.metadata.err || logMessage.metadata.ex;
              }

              const runtimeError = new errors.RuntimeError('Fatal runtime error happened.');

              runtimeError.orginalError = orginalError;
              runtimeError.logMessage = logMessage;

              unsubscribe();

              return reject(runtimeError);
            }
          };

          unsubscribe = () => {
            passThrough.removeListener('data', onData);
          };

          passThrough.on('data', onData);

          passThrough.once('end', () => {
            unsubscribe();
            resolve();
          });

          try {
            await docker.logs({ configuration, containers, env, follow: false, passThrough });
          } catch (ex) {
            reject(ex);
          }
        });
      } catch (ex) {
        isStopped = true;

        validate.emit('error', ex);
      }

      // We don't want to collect the logs as often as possible.
      // Because this can cause to performance issues, hence the sleep timeout.
      await sleep(250);
    }
  })();

  return validate;
};

module.exports = validateLogs;
