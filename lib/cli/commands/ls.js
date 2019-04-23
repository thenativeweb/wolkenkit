'use strict';

const buntstift = require('buntstift');

const ls = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'ls' is deprecated, use 'runtime list' instead.`);
  }
};

module.exports = ls;
