'use strict';

const fs = require('fs'),
      { promisify } = require('util');

const statFile = promisify(fs.stat);

const stat = async function (path) {
  if (!path) {
    throw new Error('Path is missing.');
  }

  const stats = await statFile(path);

  return stats;
};

module.exports = stat;
