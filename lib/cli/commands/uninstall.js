'use strict';

const buntstift = require('buntstift');

const uninstall = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'uninstall' is deprecated, use 'runtime uninstall' instead.`);
  }
};

module.exports = uninstall;
