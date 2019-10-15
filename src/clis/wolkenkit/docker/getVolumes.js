'use strict';

const flatten = require('lodash/flatten'),
      map = require('lodash/map'),
      merge = require('lodash/merge');

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const getVolumes = async function ({ configuration, where }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!where) {
    throw new Error('Where is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  const filter = flatten(
    map(where, (keyValuePair, criterion) =>
      map(keyValuePair, (value, key) => `--filter ${criterion}="${key}=${value}"`))
  );

  const { stdout } = await shell.exec(`docker volume ls ${filter.join(' ')} --format "{{json .}}"`, {
    env: environmentVariables
  });

  const volumes = stdout.
    split('\n').
    filter(item => item).
    map(item => JSON.parse(item)).
    map(volume => ({
      name: volume.Name,
      labels: volume.Labels.split(',').
        map(label => {
          const [ key, value ] = label.split('=');

          return { [key]: value };
        }).
        reduce((labels, label) => merge({}, labels, label))
    }));

  return volumes;
};

module.exports = getVolumes;
