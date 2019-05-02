'use strict';

const getAuthorizationSchema = function () {
  const result = {
    type: 'object',
    properties: {
      owner: {
        type: [ 'integer', 'number', 'string' ]
      },
      commands: {
        type: 'object',
        properties: {
          removeFile: {
            type: 'object',
            properties: {
              forAuthenticated: {
                type: 'boolean'
              },
              forPublic: {
                type: 'boolean'
              }
            },
            additionalProperties: false,
            required: [ 'forAuthenticated', 'forPublic' ]
          },
          transferOwnership: {
            type: 'object',
            properties: {
              forAuthenticated: {
                type: 'boolean'
              },
              forPublic: {
                type: 'boolean'
              }
            },
            additionalProperties: false,
            required: [ 'forAuthenticated', 'forPublic' ]
          },
          authorize: {
            type: 'object',
            properties: {
              forAuthenticated: {
                type: 'boolean'
              },
              forPublic: {
                type: 'boolean'
              }
            },
            additionalProperties: false,
            required: [ 'forAuthenticated', 'forPublic' ]
          }
        },
        additionalProperties: false,
        required: [ 'removeFile', 'transferOwnership', 'authorize' ]
      },
      queries: {
        type: 'object',
        properties: {
          getFile: {
            type: 'object',
            properties: {
              forAuthenticated: {
                type: 'boolean'
              },
              forPublic: {
                type: 'boolean'
              }
            },
            additionalProperties: false,
            required: [ 'forAuthenticated', 'forPublic' ]
          }
        },
        additionalProperties: false,
        required: [ 'getFile' ]
      }
    },
    required: [ 'owner', 'commands', 'queries' ],
    additionalProperties: false
  };

  return result;
};

module.exports = getAuthorizationSchema;
