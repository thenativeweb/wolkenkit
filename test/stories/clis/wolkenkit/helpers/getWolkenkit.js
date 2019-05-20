'use strict';

const path = require('path');

const map = require('lodash/map'),
      processenv = require('processenv');

const shell = require('../../../../../clis/wolkenkit/shell');

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
    const command = `${executablePath} ${name} --verbose ${map(parameters, (value, key) => {
      if (typeof value === 'boolean') {
        return value ? `--${key}` : '';
      }

      return `--${key}=${value}`;
    }).join(' ')}`;

    const execOptions = {
      ...opts,
      env: {
        ...processenv(),
        ...opts.env || {},
        DOCKER_HOST: `tcp://${ipAddress}:2376`,
        DOCKER_TLS_VERIFY: 'yes',
        DOCKER_CERT_PATH: path.join(__dirname, '..', 'terraform', '.docker', ipAddress)
      }
    };

    const output = { code: 0, stdout: '', stderr: '' };

    try {
      const { stdout, stderr } = await shell.exec(command, execOptions);

      output.stdout = stdout;
      output.stderr = stderr;
    } catch (ex) {
      output.code = ex.code;
      output.stdout = ex.stdout;
      output.stderr = ex.stderr;
    }

    // Remove spinner output.
    output.stderr = output.stderr.replace(/(?<spinner>\r⠋|\r⠙|\r⠹|\r⠸|\r⠼|\r⠴|\r⠦|\r⠧|\r⠇|\r⠏|\r)+/u, '');

    return output;
  };
};

module.exports = getWolkenkit;
