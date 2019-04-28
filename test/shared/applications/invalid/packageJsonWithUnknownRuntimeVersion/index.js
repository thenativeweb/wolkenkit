'use strict';

const path = require('path');

const setupApplication = require('../../setupApplication');

const packageJsonWithUnknownRuntimeVersion = async function () {
  const directory = await setupApplication({
    configure (packageJson) {
      packageJson.wolkenkit.runtime.version = 'unknown.runtime.version';

      return packageJson;
    }
  });

  return directory;
};

module.exports = packageJsonWithUnknownRuntimeVersion;
