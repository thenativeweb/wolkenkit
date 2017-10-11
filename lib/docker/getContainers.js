'use strict';

const flatten = require('lodash/flatten'),
      map = require('lodash/map'),
      merge = require('lodash/merge');

const getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const getContainers = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.where) {
    throw new Error('Where is missing.');
  }

  const { configuration, env, where } = options;

  const environmentVariables = await getEnvironmentVariables({ configuration, env });

  const filter = flatten(
    map(where, (keyValuePair, criterion) =>
      map(keyValuePair, (value, key) => `--filter '${criterion}=${key}=${value}'`)));

  const { stdout } = await shell.exec(`docker ps --all ${filter.join(' ')} --format '{{json .}}'`, {
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
