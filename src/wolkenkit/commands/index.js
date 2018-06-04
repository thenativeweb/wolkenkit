'use strict';

const health = require('./health'),
      init = require('./init'),
      install = require('./install'),
      logs = require('./logs'),
      ls = require('./ls'),
      reload = require('./reload'),
      restart = require('./restart'),
      start = require('./start'),
      status = require('./status'),
      stop = require('./stop'),
      uninstall = require('./uninstall'),
      update = require('./update');

module.exports = {
  health,
  init,
  install,
  logs,
  ls,
  reload,
  restart,
  start,
  status,
  stop,
  uninstall,
  update
};
