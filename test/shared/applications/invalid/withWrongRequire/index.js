'use strict';

const path = require('path');

const setupApplication = require('../../setupApplication');

const withWrongRequire = async function () {
  const directory = await setupApplication({
    remove: [ 'server/writeModel/sampleContext/*' ],
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

module.exports = withWrongRequire;
