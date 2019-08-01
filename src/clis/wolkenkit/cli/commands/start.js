'use strict';

const buntstift = require('buntstift');

const start = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'start' is deprecated, use 'infrastructure start' and 'application start' instead.`);
  }
};

module.exports = start;
