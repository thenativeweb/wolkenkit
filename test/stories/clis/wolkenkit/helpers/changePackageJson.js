'use strict';

const fs = require('fs'),
      path = require('path'),
      { promisify } = require('util');

const merge = require('lodash/merge');

const readJson = require('../../../../../clis/wolkenkit/file/readJson');

const writeFile = promisify(fs.writeFile);

const changePackageJson = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.data) {
    throw new Error('Data is missing.');
  }

  const { data, directory } = options;

  const filename = path.join(directory, 'package.json');

  let packageJson = await readJson(filename);

  packageJson = merge({}, packageJson, data);
  packageJson = JSON.stringify(packageJson);

  await writeFile(filename, packageJson);
};

module.exports = changePackageJson;
