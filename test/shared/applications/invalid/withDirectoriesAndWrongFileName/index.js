'use strict';

const path = require('path');

const setupApplication = require('../../setupApplication');

const withDirectoriesAndWrongFileName = async function () {
  const directory = await setupApplication({
    remove: [ 'server/domain/sampleContext/*' ],
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

module.exports = withDirectoriesAndWrongFileName;
