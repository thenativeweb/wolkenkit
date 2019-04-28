'use strict';

const flaschenpost = require('flaschenpost');

class LoggerService {
  constructor ({ fileName }) {
    if (!fileName) {
      throw new Error('File name is missing.');
    }

    const logLevels = [ 'fatal', 'error', 'warn', 'info', 'debug' ];
    const logger = flaschenpost.getLogger(fileName);

    for (const logLevel of logLevels) {
      this[logLevel] = function (message, metadata) {
        if (!message) {
          throw new Error('Message is missing.');
        }

        logger[logLevel](message, metadata);
      };
    }
  }
}

module.exports = LoggerService;
