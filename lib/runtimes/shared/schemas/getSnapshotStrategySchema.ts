import { Schema } from '../../../common/elements/Schema';

const getSnapshotStrategySchema = function (): Schema {
  return {
    anyOf: [
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: [ 'lowest' ]
          },
          configuration: {
            type: 'object',
            properties: {
              revisionDelta: {
                type: 'number',
                minimum: 1
              },
              timestampDelta: {
                type: 'number',
                minimum: 1
              }
            },
            required: [ 'revisionDelta', 'timestampDelta' ],
            additionalProperties: false
          }
        },
        required: [ 'name', 'configuration' ],
        additionalProperties: false
      },
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: [ 'revision' ]
          },
          configuration: {
            type: 'object',
            properties: {
              revisionDelta: {
                type: 'number',
                minimum: 1
              }
            },
            required: [ 'revisionDelta' ],
            additionalProperties: false
          }
        },
        required: [ 'name', 'configuration' ],
        additionalProperties: false
      },
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: [ 'timestamp' ]
          },
          configuration: {
            type: 'object',
            properties: {
              timestampDelta: {
                type: 'number',
                minimum: 1
              }
            },
            required: [ 'timestampDelta' ],
            additionalProperties: false
          }
        },
        required: [ 'name', 'configuration' ],
        additionalProperties: false
      },
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: [ 'never' ]
          }
        },
        required: [ 'name' ],
        additionalProperties: false
      }
    ]
  };
};

export {
  getSnapshotStrategySchema
};
