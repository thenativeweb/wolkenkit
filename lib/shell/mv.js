'use strict';

const shell = require('shelljs');

const mv = async function (options, source, destination) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!source) {
    throw new Error('Source is missing.');
  }
  if (!destination) {
    throw new Error('Destination is missing.');
  }

  shell.mv(options, source, destination);
};

module.exports = mv;
