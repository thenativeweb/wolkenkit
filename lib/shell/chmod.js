'use strict';

const shell = require('shelljs');

const chmod = async function (mode, file) {
  if (!mode) {
    throw new Error('Mode is missing.');
  }
  if (!file) {
    throw new Error('File is missing.');
  }

  shell.chmod(mode, file);
};

module.exports = chmod;
