'use strict';

const application = require('../../../application'),
      errors = require('../../../errors'),
      runtimes = require('../../runtimes');

const getFallbackConfiguration = async function () {
  return {
    runtime: {
      version: await runtimes.getLatestStableVersion()
    },
    environments: {
      default: {}
    }
  };
};

const getConfiguration = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (options.isPackageJsonRequired === undefined) {
    throw new Error('Is package.json required is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { env, directory, isPackageJsonRequired } = options;

  let configuration;

  try {
    configuration = await application.getConfiguration({ directory });
  } catch (ex) {
    switch (ex.code) {
      case 'EFILENOTFOUND':
        if (!isPackageJsonRequired) {
          progress({ message: 'package.json is missing, using fallback configuration.' });

          return await getFallbackConfiguration();
        }

        progress({ message: 'package.json is missing.', type: 'info' });
        break;
      case 'EFILENOTACCESSIBLE':
        progress({ message: 'package.json is not accessible.', type: 'info' });
        break;
      case 'EJSONMALFORMED':
        progress({ message: 'package.json contains malformed JSON.', type: 'info' });
        break;
      case 'ECONFIGURATIONNOTFOUND':
        progress({ message: 'package.json does not contain wolkenkit configuration.', type: 'info' });
        break;
      case 'ECONFIGURATIONMALFORMED':
        progress({ message: 'package.json contains malformed wolkenkit configuration.', type: 'info' });
        break;
      case 'EVERSIONNOTFOUND':
        progress({ message: 'package.json contains an unknown runtime version.', type: 'info' });
        break;
      default:
        progress({ message: ex.message, type: 'info' });
    }

    throw ex;
  }

  if (!configuration.environments[env]) {
    progress({ message: `package.json does not contain environment ${env}.`, type: 'info' });
    throw new errors.EnvironmentNotFound();
  }

  return configuration;
};

module.exports = getConfiguration;
