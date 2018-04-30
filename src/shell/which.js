'use strict';

const shell = require('shelljs');

const which = async function (executable) {
  if (!executable) {
    throw new Error('Executable is missing.');
  }

  return Boolean(shell.which(executable));
};

module.exports = which;
