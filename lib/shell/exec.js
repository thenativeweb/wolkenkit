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
          env = options.env || processenv();

    childProcess.exec(command, { cwd, env }, (err, stdout, stderr) => {
      if (err) {
        const ex = new errors.ExecutableFailed(stderr);

        ex.stdout = stdout;
        ex.stderr = stderr;

        return reject(ex);
      }

      resolve({ stdout, stderr });
    });
  });
};

module.exports = exec;
