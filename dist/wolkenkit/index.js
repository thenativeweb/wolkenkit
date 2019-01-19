'use strict';

var application = require('./application'),
    commands = require('./commands'),
    runtimes = require('./runtimes');

var wolkenkit = {
  application: application,
  commands: commands,
  runtimes: runtimes
};
module.exports = wolkenkit;