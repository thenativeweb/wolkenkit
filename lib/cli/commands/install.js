'use strict';

const buntstift = require('buntstift');

const install = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'install' is deprecated, use 'runtime install' instead.`);
  }
};

module.exports = install;
