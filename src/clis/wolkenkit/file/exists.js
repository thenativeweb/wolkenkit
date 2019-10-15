'use strict';

const fs = require('fs'),
      { promisify } = require('util');

const stat = promisify(fs.stat);

const exists = async function (path) {
  if (!path) {
    throw new Error('Path is missing.');
  }

  try {
    await stat(path);
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      return false;
    }

    throw ex;
  }

  return true;
};

module.exports = exists;
