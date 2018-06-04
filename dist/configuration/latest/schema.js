'use strict';

var schema = function schema() {
  var result = {
    type: 'object',
    properties: {
      application: { type: 'string', minLength: 1 },
      runtime: {
        type: 'object',
        properties: {
          version: { type: 'string', minLength: 1 }
        },
        additionalProperties: false,
        required: ['version']
      },
      environments: {
        type: 'object',
        patternProperties: {
          '.*': {
            type: 'object',
            properties: {
              api: {
                type: 'object',
                properties: {
                  address: {
                    type: 'object',
                    properties: {
                      host: { type: 'string', minLength: 1 },
                      port: { type: 'integer' }
                    },
                    additionalProperties: false,
                    required: ['host', 'port']
                  },
                  allowAccessFrom: {
                    oneOf: [{ type: 'string', minLength: 1 }, { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 }, uniqueItems: true }]
                  },
                  certificate: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                required: ['address', 'allowAccessFrom']
              },
              node: {
                type: 'object',
                properties: {
                  environment: { type: 'string', minLength: 1 }
                },
                additionalProperties: false,
                required: ['environment']
              },
              identityProvider: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                  certificate: { type: 'string', minLength: 1 }
                },
                required: ['name', 'certificate'],
                additionalProperties: false
              },
              docker: {
                type: 'object',
                properties: {
                  machine: { type: 'string', minLength: 1 }
                },
                required: ['machine'],
                additionalProperties: false
              },
              environmentVariables: {
                type: 'object',
                patternProperties: {
                  '.*': {
                    type: ['integer', 'number', 'string']
                  }
                },
                additionalProperties: false
              }
            },
            required: ['api'],
            additionalProperties: false
          }
        },
        minProperties: 1,
        additionalProperties: false
      }
    },
    required: ['application', 'runtime', 'environments'],
    additionalProperties: false
  };

  return result;
};

module.exports = schema;