'use strict';

const flaschenpost = require('flaschenpost');

const errors = require('../../../../common/errors');

const logger = flaschenpost.getLogger();

const getHandleReceivedCommand = function ({ dispatcher }) {
  if (!dispatcher) {
    throw new Error('Dispatcher is missing.');
  }

  return async function ({ command }) {
    if (!command) {
      throw new Error('Command is missing.');
    }

    try {
      await dispatcher.schedule({ command });

      logger.info('Command scheduled.', { command });
    } catch (ex) {
      logger.error('Failed to schedule command.', { command, ex });

      throw new errors.DispatchFailed();
    }
  };
};

module.exports = getHandleReceivedCommand;
