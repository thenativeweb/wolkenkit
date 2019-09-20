'use strict';

const buntstift = require('buntstift');

const shell = require('../shell');

const useNode = async function ({ versions, cwd }) {
  if (!versions) {
    throw new Error('Versions are missing.');
  }
  if (!versions.node) {
    throw new Error('Node.js version is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header(`Using Node.js ${versions.node}...`);

  await shell.execLive(`nvm install ${versions.node}`, { cwd });
  await shell.execLive(`nvm alias default ${versions.node}`, { cwd });
};

module.exports = useNode;
