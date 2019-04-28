'use strict';

const path = require('path');

const setupApplication = require('../../setupApplication');

const withDocumentation = async function () {
  const directory = await setupApplication({
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

module.exports = withDocumentation;
