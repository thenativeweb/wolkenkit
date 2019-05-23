'use strict';

const flaschenpost = require('flaschenpost');

const logger = flaschenpost.getLogger();

const handleException = function (ex) {
  logger.fatal('Unexpected exception occured.', { ex });

  /* eslint-disable unicorn/no-process-exit */
  process.exit(1);
  /* eslint-enable unicorn/no-process-exit */
};

const registerExceptionHandler = function () {
  process.on('uncaughtException', handleException);
  process.on('unhandledRejection', handleException);
};

module.exports = registerExceptionHandler;
