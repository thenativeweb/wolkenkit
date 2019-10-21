'use strict';

const read = require('./read');

const readJson = async function (fileName) {
  if (!fileName) {
    throw new Error('File name is missing.');
  }

  const data = JSON.parse(await read(fileName));

  return data;
};

module.exports = readJson;
