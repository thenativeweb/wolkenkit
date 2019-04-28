'use strict';

const path = require('path');

const omit = require('lodash/omit');

const setupApplication = require('../../setupApplication');

const packageJsonWithMissingRuntime = async function () {
  const directory = await setupApplication({
    configure (packageJson) {
      return omit(packageJson, 'wolkenkit.runtime');
    }
  });

  return directory;
};

module.exports = packageJsonWithMissingRuntime;
