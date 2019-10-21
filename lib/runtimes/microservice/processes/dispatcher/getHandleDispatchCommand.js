'use strict';

const flaschenpost = require('flaschenpost');

const errors = require('../../../../common/errors'),
      { sendCommand } = require('../../../../communication/http');

const logger = flaschenpost.getLogger();

const getHandleDispatchCommand = function ({ domainServer }) {
  if (!domainServer) {
    throw new Error('Domain server is missing.');
  }
  if (!domainServer.hostname) {
    throw new Error('Domain server hostname is missing.');
  }
  if (!domainServer.port) {
    throw new Error('Domain server port is missing.');
  }
  if (domainServer.disableRetries === undefined) {
    throw new Error('Domain server disable retries is missing.');
  }

  const { hostname, port, disableRetries } = domainServer;

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

      logger.info('Command forwarded to domain server.', { command });
    } catch (ex) {
      logger.error('Failed to forward command to domain server.', { command, ex });

      throw new errors.ForwardFailed();
    }
  };
};

module.exports = getHandleDispatchCommand;
