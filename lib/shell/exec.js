'use strict';

const childProcess = require('child_process');

const processenv = require('processenv');

const errors = require('../errors');

const exec = function (command, options = {}) {
  if (!command) {
    throw new Error('Command is missing.');
  }

  return new Promise((resolve, reject) => {
    const cwd = options.cwd || process.cwd(),
          env = options.env || processenv(),
          maxBuffer = options.maxBuffer || 1024 * 200;

    childProcess.exec(command, { cwd, env, maxBuffer }, (err, stdout, stderr) => {
      if (err) {
        const ex = new errors.ExecutableFailed(stderr);

        ex.originError = err;
        ex.stdout = stdout;
        ex.stderr = stderr;

        return reject(ex);
      }

      resolve({ stdout, stderr });
    });
  });
};

module.exports = exec;
