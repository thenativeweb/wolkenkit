'use strict';

const fs = require('fs'),
      path = require('path'),
      { promisify } = require('util');

const access = promisify(fs.access);

const directoryTree = require('directory-tree'),
      Value = require('validate-value');

const transformTree = function (nodes) {
  if (!nodes) {
    throw new Error('Nodes are missing.');
  }

  const result = {};

  for (const node of nodes) {
    const name = path.basename(node.name, '.js');

    if (!node.children) {
      result[name] = {};
      continue;
    }
    result[name] = transformTree(node.children);
  }

  return result;
};

const validateDirectory = async function ({ directory }) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }

  const serverDirectory = path.join(directory, 'server');

  await access(serverDirectory, fs.constants.R_OK);

  const tree = directoryTree(serverDirectory, {
    extensions: /\.js$/u
  });

  const transformedTree = transformTree([ tree ]);

  const value = new Value({
    type: 'object',
    properties: {
      server: {
        type: 'object',
        properties: {
          domain: {
            type: 'object',
            patternProperties: {
              '.*': {
                type: 'object',
                patternProperties: {
                  '.*': {
                    type: 'object',
                    properties: {},
                    required: [],
                    additionalProperties: true
                  }
                },
                minProperties: 1
              }
            },
            minProperties: 1
          },
          views: {
            type: 'object',
            properties: {
              lists: {
                type: 'object',
                patternProperties: {
                  '.*': {
                    type: 'object',
                    properties: {},
                    required: [],
                    additionalProperties: true
                  }
                },
                minProperties: 0
              }
            },
            required: [ 'lists' ],
            additionalProperties: false
          },
          flows: {
            type: 'object',
            patternProperties: {
              '.*': {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: true
              }
            },
            minProperties: 0
          }
        },
        required: [ 'domain', 'views', 'flows' ],
        additionalProperties: true
      }
    },
    required: [ 'server' ],
    additionalProperties: true
  });

  value.validate(transformedTree, { valueName: '.', separator: '/' });
};

module.exports = validateDirectory;
