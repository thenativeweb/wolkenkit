'use strict';

const fs = require('fs'),
      { promisify } = require('util');

const readDir = promisify(fs.readdir);

const getDirectoryList = async function (directory) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }

  const directoryList = await readDir(directory);

  return directoryList;
};

module.exports = getDirectoryList;
