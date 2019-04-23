'use strict';

const application = require('./application'),
      commands = require('./commands'),
      runtimes = require('./runtimes');

const wolkenkit = {
  application,
  commands,
  runtimes
};

module.exports = wolkenkit;
