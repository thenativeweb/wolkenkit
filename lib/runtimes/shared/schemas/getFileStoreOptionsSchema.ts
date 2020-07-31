import { getPortSchema } from './getPortSchema';
import { Schema } from '../../../common/elements/Schema';

const portSchema = getPortSchema();

const getFileStoreOptionsSchema = function (): Schema {
  return {
    type: 'object',
    oneOf: [
      {
        properties: {
          type: { type: 'string', enum: [ 'InMemory' ]}
        },
        required: [ 'type' ]
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'FileSystem' ]},
          directory: { type: 'string', minLength: 1 }
        },
        required: [ 'type' ]
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'S3' ]},
          hostName: { type: 'string', minLength: 1, format: 'hostname' },
          port: portSchema,
          encryptConnection: { type: 'boolean' },
          accessKey: { type: 'string', minLength: 1 },
          secretKey: { type: 'string', minLength: 1 },
          region: { type: 'string', minLegnth: 1 },
          bucketName: { type: 'string', minLegnth: 1 }
        },
        required: [ 'type', 'accessKey', 'secretKey', 'bucketName' ]
      }
    ],
    additionalProperties: false
  };
};

export { getFileStoreOptionsSchema };
