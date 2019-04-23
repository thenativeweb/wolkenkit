'use strict';

const buntstift = require('buntstift');

const exportCommand = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'export' is deprecated, use 'infrastructure export' instead.`);
  }
};

module.exports = exportCommand;
