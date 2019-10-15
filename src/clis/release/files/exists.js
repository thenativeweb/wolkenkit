'use strict';

const fs = require('fs'),
      { promisify } = require('util');

const access = promisify(fs.access);

const exists = async function (fileName) {
  if (!fileName) {
    throw new Error('File name is missing.');
  }

  try {
    await access(fileName, fs.constants.F_OK);
  } catch {
    return false;
  }

  return true;
};

module.exports = exists;
