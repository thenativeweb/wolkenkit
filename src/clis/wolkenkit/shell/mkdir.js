'use strict';

const shell = require('shelljs');

const mkdir = async function (options, directory) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }

  shell.mkdir(options, directory);
};

module.exports = mkdir;
