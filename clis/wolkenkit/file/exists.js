'use strict';

const fs = require('fs');

const promisify = require('util.promisify');

const statFile = promisify(fs.stat);

const exists = async function (path) {
  if (!path) {
    throw new Error('Path is missing.');
  }

  try {
    await statFile(path);
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      return false;
    }

    throw ex;
  }

  return true;
};

module.exports = exists;
