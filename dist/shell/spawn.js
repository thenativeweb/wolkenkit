'use strict';

var childProcess = require('child_process');

var processenv = require('processenv');

var spawn = function spawn(command) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!command) {
    throw new Error('Command is missing.');
  }

  var cwd = options.cwd || process.cwd(),
      env = options.env || processenv(),
      stdio = options.stdio || 'inherit';
  return childProcess.spawn(command, args, {
    cwd: cwd,
    env: env,
    stdio: stdio
  });
};

module.exports = spawn;