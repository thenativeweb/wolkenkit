import { getPortOrSocketSchema } from './getPortOrSocketSchema';
import { getProtocolSchema } from './getProtocolSchema';
import { GraphqlIncompatibleSchema } from '../../../common/elements/Schema';

const portOrSocketSchema = getPortOrSocketSchema(),
      protocolSchema = getProtocolSchema();

const getSubscriberOptionsSchema = function (): GraphqlIncompatibleSchema {
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
        required: [ 'type', 'hostName', 'portOrSocket' ],
        additionalProperties: false
      }
    ]
  };
};

export { getSubscriberOptionsSchema };
