'use strict';

const buntstift = require('buntstift');

const status = {
  async getOptionDefinitions () {
    return [];
  },

  async run () {
    buntstift.warn(`The command 'status' is deprecated, use 'infrastructure status' and 'application status' instead.`);
  }
};

module.exports = status;
