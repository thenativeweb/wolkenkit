'use strict';

const path = require('path');

const omit = require('lodash/omit');

const setupApplication = require('../../setupApplication');

const packageJsonWithoutNodeEnvironment = async function () {
  const directory = await setupApplication({
    configure (packageJson) {
      return omit(packageJson, 'wolkenkit.node.environment');
    }
  });

  return directory;
};

module.exports = packageJsonWithoutNodeEnvironment;
