'use strict';

const fs = require('fs'),
      { promisify } = require('util');

const readFile = promisify(fs.readFile);

const read = async function (fileName) {
  if (!fileName) {
    throw new Error('File name is missing.');
  }

  const data = await readFile(fileName, { encoding: 'utf8' });

  return data;
};

module.exports = read;
