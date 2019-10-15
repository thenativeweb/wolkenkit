'use strict';

const errors = require('../errors'),
      read = require('./read');

const readJson = async function (path) {
  if (!path) {
    throw new Error('Path is missing.');
  }

  const data = await read(path);

  let json;

  try {
    json = JSON.parse(data);
  } catch {
    throw new errors.JsonMalformed();
  }

  return json;
};

module.exports = readJson;
