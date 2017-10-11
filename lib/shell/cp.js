'use strict';

const shell = require('shelljs');

const cp = async function (options, source, target) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!source) {
    throw new Error('Source is missing.');
  }
  if (!target) {
    throw new Error('Target is missing.');
  }

  shell.cp(options, source, target);
};

module.exports = cp;
