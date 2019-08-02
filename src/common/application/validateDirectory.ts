import directoryTree from 'directory-tree';
import fs from 'fs';
import path from 'path';
import Value from 'validate-value';

const { access } = fs.promises;

interface ITransformedTree {
  [key: string]: ITransformedTree;
}

const transformTree = function ({ tree }: {
  tree: directoryTree.DirectoryTree;
}): ITransformedTree {
  const transformedTree: ITransformedTree = {};

  if (!tree.children) {
    return transformedTree;
  }

  for (const child of tree.children) {
    const childName = path.basename(child.name, '.js');

    transformedTree[childName] = transformTree({ tree: child });
  }

  return transformedTree;
};

const validateDirectory = async function ({ directory }: {
  directory: string;
}): Promise<void> {
  const serverDirectory = path.join(directory, 'server');

  await access(serverDirectory, fs.constants.R_OK);

  const tree = directoryTree(serverDirectory, {
    extensions: /\.js$/u
  });

  const transformedTree = transformTree({ tree });

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
