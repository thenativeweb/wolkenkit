'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const errors = require('../../errors');

const readdir = promisify(fs.readdir),
      stat = promisify(fs.stat);

const getImages = async function ({ forVersion }) {
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const pathRuntime = path.join(__dirname, '..', '..', 'configuration', forVersion);

  let entries;

  try {
    entries = await readdir(pathRuntime);
  } catch (ex) {
    switch (ex.code) {
      case 'ENOENT':
        throw new errors.VersionNotFound();
      default:
        throw ex;
    }
  }

  const images = (await Promise.all(entries.map(async entry => {
    const pathImage = path.join(pathRuntime, entry);
    const isDirectory = (await stat(pathImage)).isDirectory();

    if (!isDirectory) {
      return;
    }

    /* eslint-disable global-require */
    const image = require(path.join(pathImage, 'image'));
    /* eslint-enable global-require */

    return image();
  }))).filter(image => image);

  return images;
};

module.exports = getImages;
