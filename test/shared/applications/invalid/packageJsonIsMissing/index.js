'use strict';

const setupApplication = require('../../setupApplication');

const packageJsonIsMissing = async function () {
  const directory = await setupApplication({
    remove: [ 'package.json' ]
  });

  return directory;
};

module.exports = packageJsonIsMissing;
