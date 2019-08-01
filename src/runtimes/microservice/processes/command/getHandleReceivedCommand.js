'use strict';

const flaschenpost = require('flaschenpost');

const errors = require('../../../../common/errors'),
      { sendCommand } = require('../../../../communication/http');

const logger = flaschenpost.getLogger();

const getHandleReceivedCommand = function ({ dispatcherServer }) {
  if (!dispatcherServer) {
    throw new Error('Dispatcher server is missing.');
  }
  if (!dispatcherServer.hostname) {
    throw new Error('Dispatcher server hostname is missing.');
  }
  if (!dispatcherServer.port) {
    throw new Error('Dispatcher server port is missing.');
  }
  if (dispatcherServer.disableRetries === undefined) {
    throw new Error('Dispatcher server disable retries is missing.');
  }

  const { hostname, port, disableRetries } = dispatcherServer;

  let retries = 4;

  if (disableRetries) {
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

      logger.info('Command forwarded to dispatcher server.', { command });
    } catch (ex) {
      logger.error('Failed to forward command to dispatcher server.', { command, ex });

      throw new errors.ForwardFailed();
    }
  };
};

module.exports = getHandleReceivedCommand;
