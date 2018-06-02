'use strict';

const path = require('path');

const buntstift = require('buntstift'),
      map = require('lodash/map'),
      merge = require('lodash/merge'),
      processenv = require('processenv');

const shell = require('../../../src/shell');

const getWolkenkit = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.ipAddress) {
    throw new Error('IP address is missing.');
  }

  const { ipAddress } = options;

  return async function (name, parameters = {}, opts = {}) {
    if (name === undefined) {
      throw new Error('Name is missing.');
    }

    const executablePath = path.join(__dirname, '..', '..', '..', 'src', 'bin', 'wolkenkit.js');
    const command = `${executablePath} ${name} --verbose ${map(parameters, (value, key) => `--${key}=${value}`)}`;

    opts.env = merge({}, processenv(), opts.env || {}, {
      DOCKER_HOST: `tcp://${ipAddress}:2376`,
      DOCKER_TLS_VERIFY: 'yes',
      DOCKER_CERT_PATH: path.join(__dirname, '..', 'terraform', '.docker', ipAddress)
    });

    const output = { code: 0, stdout: '', stderr: '' };

    try {
      const { stdout, stderr } = await shell.exec(command, opts);

      output.stdout = stdout;
      output.stderr = stderr;
    } catch (ex) {
      output.code = ex.code;
      output.stdout = ex.stdout;
      output.stderr = ex.stderr;

      buntstift.warn(`Command: ${command}`);
      buntstift.warn(`stdout: ${output.stdout}`);
      buntstift.warn(`stderr: ${output.stderr}`);
    }

    // Remove spinner output.
    output.stderr = output.stderr.replace(/(\r⠋|\r⠙|\r⠹|\r⠸|\r⠼|\r⠴|\r⠦|\r⠧|\r⠇|\r⠏|\r)+/, '');

    return output;
  };
};

module.exports = getWolkenkit;
