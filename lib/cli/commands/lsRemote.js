'use strict';

const buntstift = require('buntstift');

const ls = require('./ls');

const lsRemote = {
  description: `${ls.description} (deprecated, use ls instead)`,
  getOptionDefinitions: ls.getOptionDefinitions,

  async run (options) {
    await ls.run(options);
    buntstift.warn('The command ls-remote is deprecated and will be removed in a future version, use ls instead.');
  }
};

module.exports = lsRemote;
