'use strict';

const path = require('path');

const buntstift = require('buntstift'),
      measureTime = require('measure-time'),
      processenv = require('processenv');

const shell = require('../../../../../clis/wolkenkit/shell');

const teardownAws = async function (options) {
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

  buntstift.newLine();
  buntstift.info('Tearing down AWS instance(s)...');

  const stopWaiting = buntstift.wait();

  const getElapsed = measureTime();

  await shell.exec('terraform destroy -force', {
    cwd: path.join(__dirname, '..', 'terraform'),
    env
  });

  const elapsed = getElapsed();

  stopWaiting();
  buntstift.info(`Torn down AWS instance(s). (${elapsed.seconds}s)`);
};

module.exports = teardownAws;
