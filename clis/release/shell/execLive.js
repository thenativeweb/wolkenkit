'use strict';

const buntstift = require('buntstift'),
      execa = require('execa'),
      processenv = require('processenv');

const execLive = async function (command, options = {}) {
  if (!command) {
    throw new Error('Command is missing.');
  }

  const cwd = options.cwd || process.cwd(),
        env = options.env || processenv(),
        maxBuffer = options.maxBuffer || 10 * 1000 * 1000,
        silent = Boolean(options.silent);

  if (!silent) {
    buntstift.info(`Running "${command}" in "${cwd}"…`);
  }

  const childProcess = execa('bash', [ '-c', `. ~/.profile && ${command}` ], { cwd, env, maxBuffer, silent });

  if (options.silent !== true) {
    childProcess.stdout.on('data', data => buntstift.passThrough(data));
    childProcess.stderr.on('data', data => buntstift.passThrough(data, { target: 'stderr' }));
  }

  return await childProcess;
};

module.exports = execLive;
