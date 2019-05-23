'use strict';

const flaschenpost = require('flaschenpost');

const errors = require('../../common/errors'),
      { sendCommand } = require('../../communication/http');

const logger = flaschenpost.getLogger();

const getHandleReceivedCommand = function ({ dispatcher }) {
  if (!dispatcher) {
    throw new Error('Dispatcher is missing.');
  }
  if (!dispatcher.hostname) {
    throw new Error('Dispatcher hostname is missing.');
  }
  if (!dispatcher.port) {
    throw new Error('Dispatcher port is missing.');
  }
  if (dispatcher.disableRetries === undefined) {
    throw new Error('Dispatcher disable retries is missing.');
  }

  const { hostname, port } = dispatcher;

  let retries = 4;

  if (dispatcher.disableRetries) {
    retries = 0;
  }

  return async function ({ command }) {
    if (!command) {
      throw new Error('Command is missing.');
    }

    try {
      await sendCommand({
        command,
        protocol: 'http',
        hostname,
        port,
        pathname: '/command/v2',
        retries
      });

      logger.info('Command dispatched.', { command });
    } catch (ex) {
      logger.error('Failed to dispatch command.', { command, ex });

      throw new errors.DispatchFailed();
    }
  };
};

module.exports = getHandleReceivedCommand;
