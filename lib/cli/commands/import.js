'use strict';

const buntstift = require('buntstift');

const importCommand = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'import' is deprecated, use 'infrastructure import' instead.`);
  }
};

module.exports = importCommand;
