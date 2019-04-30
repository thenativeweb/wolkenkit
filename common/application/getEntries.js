'use strict';

const path = require('path');

const requireDir = require('require-dir');

const getEntries = async function ({ directory }) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }

  const serverDirectory = path.join(directory, 'server');
  const entries = requireDir(serverDirectory, { recurse: true });

  // If an index.js file is given inside of an aggregate, list or flow, use it
  // instead of the individual files.
  for (const context of Object.values(entries.domain)) {
    for (const [ aggregateName, aggregate ] of Object.entries(context)) {
      if (aggregate.index) {
        context[aggregateName] = { ...aggregate.index };
      }
    }
  }
  for (const modelType of Object.values(entries.views)) {
    for (const [ modelName, model ] of Object.entries(modelType)) {
      if (model.index) {
        modelType[modelName] = { ...model.index };
      }
    }
  }
  for (const [ flowName, flow ] of Object.entries(entries.flows)) {
    if (flow.index) {
      entries.flows[flowName] = { ...flow.index };
    }
  }

  return { server: entries };
};

module.exports = getEntries;
