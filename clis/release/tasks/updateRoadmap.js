'use strict';

const buntstift = require('buntstift');

const shell = require('../shell');

const updateRoadmap = async function ({ mode, cwd }) {
  if (!mode) {
    throw new Error('Mode is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Updating the roadmap...');

  if (mode !== 'release') {
    return buntstift.info('Skipping update due to simulation mode.');
  }

  const needsUpdate = await buntstift.confirm('Do you need to update the roadmap?');

  if (needsUpdate) {
    await shell.execLive('open https://github.com/thenativeweb/wolkenkit/edit/master/roadmap.md', { cwd });
  }
};

module.exports = updateRoadmap;
