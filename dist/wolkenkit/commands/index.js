'use strict';

var exportCommand = require('./export'),
    health = require('./health'),
    importCommand = require('./import'),
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
    uninstall = require('./uninstall');

module.exports = {
  export: exportCommand,
  health: health,
  import: importCommand,
  init: init,
  install: install,
  logs: logs,
  ls: ls,
  reload: reload,
  restart: restart,
  shared: shared,
  start: start,
  status: status,
  stop: stop,
  uninstall: uninstall
};