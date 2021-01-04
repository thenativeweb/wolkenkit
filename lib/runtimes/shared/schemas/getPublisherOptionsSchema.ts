import { getPortOrSocketSchema } from './getPortOrSocketSchema';
import { getProtocolSchema } from './getProtocolSchema';
import { Schema } from '../../../common/elements/Schema';

const portOrSocketSchema = getPortOrSocketSchema(),
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
          portOrSocket: portOrSocketSchema,
          path: { type: 'string' }
        },
        required: [ 'type', 'hostName', 'port' ],
        additionalProperties: false
      }
    ]
  };
};

export { getPublisherOptionsSchema };
