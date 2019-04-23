'use strict';

const EventEmitter = require('events'),
      { promisify } = require('util');

const { Parser } = require('newline-json');

const docker = require('../../../docker'),
      errors = require('../../../errors');

const sleep = promisify(setTimeout);

const validateLogs = async function ({ configuration }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const containers = await docker.getContainers({
    configuration,
    where: {
      label: {
        'wolkenkit-application': configuration.application.name,
        'wolkenkit-type': 'application'
      }
    }
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
        /* eslint-disable no-loop-func */
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
            await docker.logs({
              configuration,
              containers,
              follow: false,
              passThrough
            });
          } catch (ex) {
            reject(ex);
          }
        });
        /* eslint-enable no-loop-func */
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
