'use strict';

const execLive = require('./execLive');

const copyDirectory = async function ({ source, destination }) {
  if (!source) {
    throw new Error('Source is missing.');
  }
  if (!destination) {
    throw new Error('Destination is missing.');
  }

  await execLive(`cp -r "${source}" "${destination}"`);
};

module.exports = copyDirectory;
