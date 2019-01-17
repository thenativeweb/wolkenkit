'use strict';

const flatten = require('lodash/flatten'),
      map = require('lodash/map'),
      merge = require('lodash/merge');

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const getContainers = async function ({ configuration, where }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!where) {
    throw new Error('Where is missing.');
  }

  const environmentVariables = await getEnvironmentVariables({ configuration });

  const filter = flatten(
    map(where, (keyValuePair, criterion) =>
      map(keyValuePair, (value, key) => `--filter "${criterion}=${key}=${value}"`))
  );

  const { stdout } = await shell.exec(`docker ps --all ${filter.join(' ')} --format "{{json .}}"`, {
    env: environmentVariables
  });

  const containers = stdout.
    split('\n').
    filter(item => item).
    map(item => JSON.parse(item)).
    map(container => ({
      name: container.Names,
      labels: container.Labels.split(',').
        map(label => {
          const [ key, value ] = label.split('=');

          return { [key]: value };
        }).
        reduce((labels, label) => merge({}, labels, label))
    }));

  return containers;
};

module.exports = getContainers;
