'use strict';

const path = require('path');

const get = require('lodash/get'),
      { flatten, unflatten } = require('flat');

const errors = require('../errors'),
      file = require('../file');

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

  const flattenConfiguration = flatten(configuration);

  Object.keys(flattenConfiguration).forEach(key => {
    const value = flattenConfiguration[key];

    if (typeof value !== 'string') {
      return;
    }

    if (!value.startsWith(identifier)) {
      return;
    }

    if (!secrets) {
      throw new errors.SecretFileNotFound('wolkenkit-secrets.json is missing.');
    }

    const secretSelector = value.replace(identifier, '');
    const secret = get(secrets, secretSelector);

    if (secret === undefined) {
      throw new errors.SecretNotSpecified(`Could not find a secret named '${secretSelector}'.`);
    }

    flattenConfiguration[key] = secret;
  });

  const unflattenConfiguration = unflatten(flattenConfiguration);

  return unflattenConfiguration;
};

module.exports = resolveSecrets;
