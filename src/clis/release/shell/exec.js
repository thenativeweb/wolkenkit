'use strict';

const buntstift = require('buntstift'),
      processenv = require('processenv'),
      shell = require('shelljs');

const exec = async function (command, options = {}) {
  if (!command) {
    throw new Error('Command is missing.');
  }

  const cwd = options.cwd || process.cwd(),
        env = options.env || processenv(),
        silent = Boolean(options.silent);

  if (!silent) {
    buntstift.info(`Running "${command}" in "${cwd}"…`);
  }

  const { code, stdout, stderr } = shell.exec(`bash -c '. ~/.profile && ${command}'`, { cwd, env, silent });

  return { code, stdout, stderr };
};

module.exports = exec;
