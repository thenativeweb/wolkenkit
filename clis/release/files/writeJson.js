'use strict';

const write = require('./write');

const writeJson = async function (fileName, content) {
  if (!fileName) {
    throw new Error('File name is missing.');
  }
  if (!content) {
    throw new Error('Content is missing.');
  }

  await write(fileName, JSON.stringify(content, null, 2));
};

module.exports = writeJson;
