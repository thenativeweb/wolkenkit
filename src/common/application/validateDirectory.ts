import directoryTree from 'directory-tree';
import fs from 'fs';
import path from 'path';
import Value from 'validate-value';

const { access } = fs.promises;

const transformTree = function (nodes: directoryTree.DirectoryTree[]): {
  [key: string]: {};
} {
  if (!nodes) {
    throw new Error('Nodes are missing.');
  }

  const result: {
    [key: string]: {};
  } = {};

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

const validateDirectory = async function ({ directory }: {
  directory: string;
}): Promise<void> {
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

export default validateDirectory;
