'use strict';

const processenv = require('processenv');

const application = require('../../../application'),
      errors = require('../../../errors'),
      runtimes = require('../../runtimes'),
      switchSemver = require('../../../switchSemver');

const getFallbackPackgeJson = async function () {
  const fallbackPackageJson = {
    runtime: {
      version: await runtimes.getLatestStableVersion()
    },
    environments: {
      default: {}
    }
  };

  return fallbackPackageJson;
};

const getConfiguration = async function ({
  directory,
  env,
  isPackageJsonRequired,
  port = undefined
}, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (isPackageJsonRequired === undefined) {
    throw new Error('Is package.json required is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  let packageJson;

  try {
    packageJson = await application.getConfiguration({ directory });
  } catch (ex) {
    switch (ex.code) {
      case 'EFILENOTFOUND':
        if (!isPackageJsonRequired) {
          progress({ message: 'package.json is missing, using fallback configuration.' });
          packageJson = await getFallbackPackgeJson();

          return { packageJson };
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
        progress({ message: `package.json contains malformed configuration (${ex.message.slice(0, -1)}).`, type: 'info' });
        break;
      case 'EVERSIONNOTFOUND':
        progress({ message: 'package.json contains an unknown runtime version.', type: 'info' });
        break;
      default:
        progress({ message: ex.message, type: 'info' });
    }

    throw ex;
  }

  const selectedEnvironment = packageJson.environments[env];

  if (!selectedEnvironment) {
    progress({ message: `package.json does not contain environment ${env}.`, type: 'info' });
    throw new errors.EnvironmentNotFound();
  }

  const selectedEnvironmentType = selectedEnvironment.type || 'cli';
  const runtimeVersion = packageJson.runtime.version;
  const configuration = { packageJson };

  configuration.getContainers = async ({
    sharedKey,
    persistData,
    dangerouslyExposeHttpPorts,
    debug
  }) => {
    if (!sharedKey) {
      throw new Error('Shared key is missing.');
    }
    if (persistData === undefined) {
      throw new Error('Persist data is missing.');
    }
    if (dangerouslyExposeHttpPorts === undefined) {
      throw new Error('Dangerously expose http ports is missing.');
    }
    if (debug === undefined) {
      throw new Error('Debug is missing.');
    }

    const containers = await runtimes.getContainers({
      forVersion: runtimeVersion,
      configuration,
      env,
      persistData,
      dangerouslyExposeHttpPorts,
      debug
    });

    return containers;
  };

  await switchSemver(runtimeVersion, {
    async default () {
      configuration.application = {
        name: packageJson.application,
        runtime: { version: runtimeVersion }
      };
      configuration.api = {
        host: {
          name: selectedEnvironment.api.address.host,
          certificate: selectedEnvironment.api.certificate
        },
        port: port || processenv('WOLKENKIT_PORT') || selectedEnvironment.api.address.port,
        allowAccessFrom: selectedEnvironment.api.allowAccessFrom
      };

      if (selectedEnvironment.node) {
        configuration.node = {
          environment: selectedEnvironment.node.environment
        };
      }

      if (selectedEnvironment.identityProvider) {
        configuration.identityProvider = {
          issuer: selectedEnvironment.identityProvider.name,
          certificate: selectedEnvironment.identityProvider.certificate
        };
      }

      if (selectedEnvironment.environmentVariables) {
        configuration.environmentVariables = selectedEnvironment.environmentVariables;
      }

      switch (selectedEnvironmentType) {
        case 'cli':
          // TODO: it is only available since 3.0.0
          configuration.fileStorage = {
            allowAccessFrom: selectedEnvironment.fileStorage.allowAccessFrom,
            isAuthorized: selectedEnvironment.fileStorage.isAuthorized
          };

          if (selectedEnvironment.docker) {
            configuration.docker = {
              machine: selectedEnvironment.docker.machine
            };
          }
          break;

        case 'aufwind':
          configuration.deployment = selectedEnvironment.deployment;

          if (selectedEnvironment.infrastructure) {
            configuration.infrastructure = selectedEnvironment.infrastructure;
          }
          break;

        default:
          throw new Error(`Unknown environment type '${selectedEnvironmentType}'.`);
      }
    }
  });

  return configuration;
};

module.exports = getConfiguration;
