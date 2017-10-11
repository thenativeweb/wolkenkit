'use strict';

const shell = require('shelljs');

const rm = async function (options, path) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!path) {
    throw new Error('Path is missing.');
  }

  shell.rm(options, path);
};

module.exports = rm;
