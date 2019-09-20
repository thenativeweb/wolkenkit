'use strict';

const fs = require('fs'),
      { promisify } = require('util');

const writeFile = promisify(fs.writeFile);

const write = async function (fileName, content) {
  if (!fileName) {
    throw new Error('File name is missing.');
  }
  if (!content) {
    throw new Error('Content is missing.');
  }

  await writeFile(fileName, content, { encoding: 'utf8' });
};

module.exports = write;
