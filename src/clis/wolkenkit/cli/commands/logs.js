'use strict';

const buntstift = require('buntstift');

const logs = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'logs' is deprecated, use 'application logs' instead.`);
  }
};

module.exports = logs;
