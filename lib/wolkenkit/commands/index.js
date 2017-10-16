'use strict';

const deploy = require('./deploy'),
      health = require('./health'),
      init = require('./init'),
      install = require('./install'),
      logs = require('./logs'),
      ls = require('./ls'),
      lsRemote = require('./lsRemote'),
      reload = require('./reload'),
      restart = require('./restart'),
      start = require('./start'),
      status = require('./status'),
      stop = require('./stop'),
      uninstall = require('./uninstall'),
      update = require('./update');

module.exports = {
  deploy,
  health,
  init,
  install,
  logs,
  ls,
  lsRemote,
  reload,
  restart,
  start,
  status,
  stop,
  uninstall,
  update
};
