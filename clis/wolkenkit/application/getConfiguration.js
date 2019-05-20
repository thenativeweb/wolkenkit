'use strict';

const path = require('path');

const Value = require('validate-value');

const errors = require('../errors'),
      file = require('../file'),
      resolveSecrets = require('./resolveSecrets'),
      transformEnvironmentVariables = require('./transformEnvironmentVariables');

const getConfiguration = async function ({ directory }) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }

  const configurationFile = path.join(directory, 'package.json');
  const packageJson = await file.readJson(configurationFile);

  let configuration = packageJson.wolkenkit;

  if (!configuration) {
    throw new errors.ConfigurationNotFound();
  }

  configuration = await resolveSecrets({ configuration, directory });

  let runtimeVersion;

  try {
    runtimeVersion = configuration.runtime.version;
  } catch {
    throw new errors.ConfigurationMalformed();
  }

  let schema;

  try {
    /* eslint-disable global-require */
    schema = require(`../configuration/${runtimeVersion}/schema`)();
    /* eslint-enable global-require */
  } catch (ex) {
    switch (ex.code) {
      case 'MODULE_NOT_FOUND':
        throw new errors.VersionNotFound();
      default:
        throw ex;
    }
  }

  const value = new Value(schema);

  try {
    value.validate(configuration, { valueName: 'wolkenkit' });
  } catch (ex) {
    throw new errors.ConfigurationMalformed(ex.message);
  }

  Object.keys(configuration.environments).forEach(name => {
    const currentEnvironment = configuration.environments[name];

    const { environmentVariables } = currentEnvironment;

    if (!environmentVariables) {
      return;
    }

    configuration.environments[name].environmentVariables = transformEnvironmentVariables({ environmentVariables });
  });

  return configuration;
};

module.exports = getConfiguration;
