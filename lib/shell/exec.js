'use strict';

const childProcess = require('child_process');

const processenv = require('processenv'),
      promisify = require('util.promisify');

const errors = require('../errors');

const childProcessExec = promisify(childProcess.exec);

const exec = async function (command, options = {}) {
  if (!command) {
    throw new Error('Command is missing.');
  }

  const cwd = options.cwd || process.cwd(),
        env = options.env || processenv();

  let output;

  try {
    output = await childProcessExec(command, { cwd, env });
  } catch (ex) {
    const error = new errors.ExecutableFailed(ex.stderr);

    error.stdout = ex.stdout;
    error.stderr = ex.stderr;

    throw error;
  }

  return output;
};

module.exports = exec;
