'use strict';

const path = require('path');

const setupApplication = require('../../setupApplication');

const withMap = async function () {
  const directory = await setupApplication({
    remove: [
      'server/writeModel/sampleContext/*',
      'server/readModel/lists/*'
    ],
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

module.exports = withMap;
