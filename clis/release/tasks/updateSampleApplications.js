'use strict';

const buntstift = require('buntstift');

const updateSampleApplications = async function ({ mode, cwd }) {
  if (!mode) {
    throw new Error('Mode is missing.');
  }
  if (!cwd) {
    throw new Error('Current working directory is missing.');
  }

  buntstift.header('Updating the sample applications...');

  if (mode !== 'release') {
    return buntstift.info('Skipping update due to simulation mode.');
  }

  buntstift.list('templates');
  buntstift.list('wolkenkit-template-chat', { indent: 1 });
  buntstift.list('wolkenkit-template-empty', { indent: 1 });
  buntstift.list('wolkenkit-template-minimal', { indent: 1 });

  buntstift.newLine();

  buntstift.list('sample applications');
  buntstift.list('wolkenkit-boards', { indent: 1 });
  buntstift.list('wolkenkit-nevercompletedgame', { indent: 1 });
  buntstift.list('wolkenkit-todomvc', { indent: 1 });

  buntstift.newLine();
  buntstift.warn('Please update the sample applications!');
  buntstift.newLine();

  await buntstift.confirm('Did you update the sample applications?');
};

module.exports = updateSampleApplications;
