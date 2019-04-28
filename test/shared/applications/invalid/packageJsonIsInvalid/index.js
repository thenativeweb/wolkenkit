'use strict';

const path = require('path');

const setupApplication = require('../../setupApplication');

const packageJsonIsInvalid = async function () {
  const directory = await setupApplication({
    remove: [ 'package.json' ],
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

module.exports = packageJsonIsInvalid;
