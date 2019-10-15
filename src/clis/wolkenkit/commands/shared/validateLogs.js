'use strict';

const EventEmitter = require('events');

const { Parser } = require('newline-json');

const docker = require('../../docker'),
      errors = require('../../errors'),
      sleep = require('../../../common/utils/sleep');

const validateLogs = async function ({ configuration }, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  let containers = await docker.getContainers({
    configuration,
    where: {
      label: {
        'wolkenkit-application': configuration.application.name,
        'wolkenkit-type': 'application'
      }
    }
  });

  containers = containers.filter(container => !container.name.endsWith('proxy'));

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

      // We don't want to collect the logs continuously, because this could lead
      // to performance issues. Hence, delay here.
      await sleep({ ms: 250 });
    }
  })();

  return validate;
};

module.exports = validateLogs;
