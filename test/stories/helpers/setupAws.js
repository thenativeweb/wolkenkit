'use strict';

const fs = require('fs'),
      path = require('path');

const buntstift = require('buntstift'),
      measureTime = require('measure-time'),
      processenv = require('processenv'),
      promisify = require('util.promisify');

const shell = require('../../../lib/shell');

const readFile = promisify(fs.readFile);

const setupAws = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.instanceCount) {
    throw new Error('Instance count is missing.');
  }

  const env = processenv();

  if (!env.TF_VAR_aws_access_key) {
    throw new Error('Environment variable TF_VAR_aws_access_key is missing.');
  }
  if (!env.TF_VAR_aws_secret_key) {
    throw new Error('Environment variable TF_VAR_aws_secret_key is missing.');
  }

  const { instanceCount } = options;

  /* eslint-disable camelcase */
  env.TF_VAR_aws_instance_count = instanceCount;
  /* eslint-enable camelcase */

  buntstift.info('Setting up AWS instance(s)...');

  const stopWaiting = buntstift.wait();

  const getElapsed = measureTime();

  await shell.exec('terraform apply', {
    cwd: path.join(__dirname, '..', 'terraform'),
    env
  });

  const elapsed = getElapsed();

  stopWaiting();
  buntstift.info(`Set up AWS instance(s). (${elapsed.seconds}s)`);
  buntstift.newLine();

  /* eslint-disable global-require */
  const tfstate = JSON.parse(await readFile(path.join(__dirname, '..', 'terraform', 'terraform.tfstate'), { encoding: 'utf8' }));
  /* eslint-enable global-require */

  const ipAddresses = tfstate.modules[0].outputs.ip.value;

  return ipAddresses;
};

module.exports = setupAws;
