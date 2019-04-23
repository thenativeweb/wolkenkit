'use strict';

const buntstift = require('buntstift');

const reload = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'reload' is deprecated, use 'application restart' instead.`);
  }
};

module.exports = reload;
