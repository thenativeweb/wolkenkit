'use strict';

const path = require('path');

const omit = require('lodash/omit');

const setupApplication = require('../../setupApplication');

const packageJsonWithoutWolkenkit = async function () {
  const directory = await setupApplication({
    configure (packageJson) {
      return omit(packageJson, 'wolkenkit');
    }
  });

  return directory;
};

module.exports = packageJsonWithoutWolkenkit;
