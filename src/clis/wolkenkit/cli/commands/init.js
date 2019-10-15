'use strict';

const buntstift = require('buntstift');

const init = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'init' is deprecated, use 'application init' instead.`);
  }
};

module.exports = init;
