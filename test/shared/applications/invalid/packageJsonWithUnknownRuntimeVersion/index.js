'use strict';

const path = require('path');

const cloneDeep = require('lodash/cloneDeep');

const setupApplication = require('../../setupApplication');

const packageJsonWithUnknownRuntimeVersion = async function () {
  const directory = await setupApplication({
    configure (packageJson) {
      const configuredPackageJson = cloneDeep(packageJson);

      configuredPackageJson.wolkenkit.runtime.version = 'unknown.runtime.version';

      return configuredPackageJson;
    }
  });

  return directory;
};

module.exports = packageJsonWithUnknownRuntimeVersion;
