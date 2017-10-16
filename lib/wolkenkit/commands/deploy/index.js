'use strict';

const path = require('path');

const isolated = require('isolated'),
      promisify = require('util.promisify'),
      request = require('superagent'),
      tar = require('tar');

const noop = require('../../../noop'),
      shared = require('../shared');

const isolatedAsync = promisify(isolated);

const deploy = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.server) {
    throw new Error('Server is missing.');
  }

  const { env, directory, server } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

  const tempDirectory = await isolatedAsync();

  progress({ message: `Created temporary directory: ${directory}` });

  const tarFile = path.join(tempDirectory, `${configuration.application}.tar.gz`);

  await tar.c({
    file: tarFile,
    gzip: true,
    cwd: directory
  }, [ 'package.json', 'server' ]);

  progress({ message: `Created tar file: ${tarFile}` });

  await request.post(server).attach('wk-application', tarFile);

  progress({ message: `Posted tar file to ${server}` });
};

module.exports = deploy;
