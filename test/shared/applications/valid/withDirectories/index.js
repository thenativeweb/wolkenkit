'use strict';

const path = require('path');

const setupApplication = require('../../setupApplication');

const withDirectories = async function () {
  const directory = await setupApplication({
    remove: [
      'server/domain/sampleContext/*',
      'server/views/lists/*',
      'server/flows/*'
    ],
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

module.exports = withDirectories;
