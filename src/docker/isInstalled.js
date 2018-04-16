'use strict';

const shell = require('../shell');

const isInstalled = async function () {
  return Boolean(await shell.which('docker'));
};

module.exports = isInstalled;
