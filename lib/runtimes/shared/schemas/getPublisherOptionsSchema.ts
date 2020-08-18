import { getPortSchema } from './getPortSchema';
import { getProtocolSchema } from './getProtocolSchema';
import { Schema } from '../../../common/elements/Schema';

const portSchema = getPortSchema(),
      protocolSchema = getProtocolSchema();

const getPublisherOptionsSchema = function (): Schema {
  return {
    type: 'object',
    oneOf: [
      {
        properties: {
          type: { type: 'string', enum: [ 'InMemory' ]}
        },
        required: [ 'type' ],
        additionalProperties: false
      },
      {
        properties: {
          type: { type: 'string', enum: [ 'Http' ]},
          protocol: protocolSchema,
          hostName: { type: 'string', format: 'hostname' },
          port: portSchema,
          path: { type: 'string' }
        },
        required: [ 'type', 'hostName', 'port' ],
        additionalProperties: false
      }
    ]
  };
};

export { getPublisherOptionsSchema };
