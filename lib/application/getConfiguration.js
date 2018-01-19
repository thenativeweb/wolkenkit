'use strict';

const path = require('path');

const ajv = require('ajv');

const errors = require('../errors'),
      file = require('../file'),
      transformEnvironmentVariables = require('./transformEnvironmentVariables');

const getConfiguration = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }

  const { directory } = options;

  const configurationFile = path.join(directory, 'package.json');
  const packageJson = await file.readJson(configurationFile);

  const configuration = packageJson.wolkenkit;

  if (!configuration) {
    throw new errors.ConfigurationNotFound();
  }

  let runtimeVersion;

  try {
    runtimeVersion = configuration.runtime.version;
  } catch (ex) {
    throw new errors.ConfigurationMalformed();
  }

  let schema;

  try {
    /* eslint-disable global-require */
    schema = require(`../../configuration/${runtimeVersion}/schema`)();
    /* eslint-enable global-require */
  } catch (ex) {
    switch (ex.code) {
      case 'MODULE_NOT_FOUND':
        throw new errors.VersionNotFound();
      default:
        throw ex;
    }
  }

  const isValid = ajv().compile(schema);

  if (!isValid(configuration)) {
    throw new errors.ConfigurationMalformed();
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
