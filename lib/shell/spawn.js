'use strict';

const childProcess = require('child_process');

const processenv = require('processenv');

const spawn = function (command, args = [], options = {}) {
  if (!command) {
    throw new Error('Command is missing.');
  }

  const cwd = options.cwd || process.cwd(),
        env = options.env || processenv(),
        stdio = options.stdio || 'inherit';

  return childProcess.spawn(command, args, { cwd, env, stdio });
};

module.exports = spawn;
