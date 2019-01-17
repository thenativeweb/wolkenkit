'use strict';

const path = require('path');

const get = require('lodash/get'),
      { flatten, unflatten } = require('flat');

const errors = require('../../errors'),
      file = require('../../file');

const resolveSecrets = async function ({ configuration, directory }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }

  let secrets;

  try {
    secrets = await file.readJson(path.join(directory, 'wolkenkit-secrets.json'));
  } catch (ex) {
    if (ex.code !== 'EFILENOTFOUND') {
      throw ex;
    }
  }

  const identifier = 'secret://';

  const flattenedConfiguration = flatten(configuration);

  for (const [ key, value ] of Object.entries(flattenedConfiguration)) {
    if (typeof value !== 'string') {
      continue;
    }

    if (!value.startsWith(identifier)) {
      continue;
    }

    if (!secrets) {
      throw new errors.SecretFileNotFound('wolkenkit-secrets.json is missing.');
    }

    const secretSelector = value.replace(identifier, '');
    const secret = get(secrets, secretSelector);

    if (secret === undefined) {
      throw new errors.SecretNotFound(`Could not find a secret named '${secretSelector}'.`);
    }

    flattenedConfiguration[key] = secret;
  }

  const unflattenedConfiguration = unflatten(flattenedConfiguration);

  return unflattenedConfiguration;
};

module.exports = resolveSecrets;
