'use strict';

var health = require('./health'),
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
  health: health,
  init: init,
  install: install,
  logs: logs,
  ls: ls,
  reload: reload,
  restart: restart,
  start: start,
  status: status,
  stop: stop,
  uninstall: uninstall,
  update: update
};