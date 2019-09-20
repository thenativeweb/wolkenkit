import directoryTree from 'directory-tree';
import path from 'path';
import Value from 'validate-value';
import { constants, promises as fs } from 'fs';

const { access } = fs;

interface TransformedTree {
  [key: string]: TransformedTree;
}

const transformTree = function ({ tree }: {
  tree: directoryTree.DirectoryTree;
}): TransformedTree {
  const transformedTree: TransformedTree = {};

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

  await access(serverDirectory, constants.R_OK);

  const tree = directoryTree(serverDirectory, {
    extensions: /\.js$/u
  });

  const transformedTree = transformTree({ tree });

  const value = new Value({
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
  });

  value.validate(transformedTree, { valueName: './server', separator: '/' });
};

export default validateDirectory;
