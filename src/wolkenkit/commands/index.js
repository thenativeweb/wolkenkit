'use strict';

const encrypt = require('./encrypt'),
      exportCommand = require('./export'),
      health = require('./health'),
      init = require('./init'),
      install = require('./install'),
      logs = require('./logs'),
      ls = require('./ls'),
      reload = require('./reload'),
      restart = require('./restart'),
      shared = require('./shared'),
      start = require('./start'),
      status = require('./status'),
      stop = require('./stop'),
      uninstall = require('./uninstall'),
      update = require('./update');

module.exports = {
  encrypt,
  export: exportCommand,
  health,
  init,
  install,
  logs,
  ls,
  reload,
  restart,
  shared,
  start,
  status,
  stop,
  uninstall,
  update
};
