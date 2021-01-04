import { getPortSchema } from './getPortSchema';
import { getProtocolSchema } from './getProtocolSchema';
import { Schema } from '../../../common/elements/Schema';

const portOrSocketSchema = getPortSchema(),
      protocolSchema = getProtocolSchema();

const getSubscriberOptionsSchema = function (): Schema {
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

export { getSubscriberOptionsSchema };
