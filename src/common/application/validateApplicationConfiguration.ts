import { ApplicationConfiguration } from './ApplicationConfiguration';
import { ApplicationConfigurationWeak } from './ApplicationConfigurationWeak';
import Value from 'validate-value';

const validateApplicationConfiguration = function ({ applicationConfiguration }: {
  applicationConfiguration: ApplicationConfigurationWeak;
}): ApplicationConfiguration {
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
                properties: {
                  initialState: {
                    type: 'object',
                    properties: {},
                    required: [],
                    additionalProperties: true
                  },
                  commands: {
                    type: 'object',
                    patternProperties: {
                      '.*': {
                        type: 'object',
                        properties: {
                          documentation: { type: 'string', minLength: 1 },
                          schema: {
                            type: 'object',
                            properties: {},
                            required: [],
                            additionalProperties: true
                          },
                          isAuthorized: {},
                          handle: {}
                        },
                        required: [ 'isAuthorized', 'handle' ],
                        additionalProperties: false
                      }
                    }
                  },
                  events: {
                    type: 'object',
                    patternProperties: {
                      '.*': {
                        type: 'object',
                        properties: {
                          documentation: { type: 'string', minLength: 1 },
                          schema: {
                            type: 'object',
                            properties: {},
                            required: [],
                            additionalProperties: true
                          },
                          handle: {},
                          isAuthorized: {},
                          filter: {},
                          map: {}
                        },
                        required: [ 'handle', 'isAuthorized' ],
                        additionalProperties: false
                      }
                    }
                  }
                },
                required: [ 'initialState', 'commands', 'events' ],
                additionalProperties: false
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
                properties: {
                  fields: {
                    type: 'object',
                    patternProperties: {
                      '.*': {
                        type: 'object',
                        properties: {
                          initialState: {},
                          fastLookup: { type: 'boolean' },
                          isUnique: { type: 'boolean' }
                        },
                        required: [ 'initialState' ],
                        additionalProperties: false
                      }
                    },
                    minProperties: 1
                  },
                  projections: {
                    type: 'object',
                    properties: {},
                    required: [],
                    additionalProperties: true
                  },
                  queries: {
                    type: 'object',
                    properties: {
                      readItem: {
                        type: 'object',
                        properties: {
                          isAuthorized: {},
                          filter: {},
                          map: {}
                        },
                        required: [ 'isAuthorized' ],
                        additionalProperties: false
                      }
                    },
                    required: [ 'readItem' ],
                    additionalProperties: false
                  }
                },
                required: [ 'fields', 'projections', 'queries' ],
                additionalProperties: false
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
            oneOf: [
              {
                type: 'object',
                properties: {
                  reactions: {
                    type: 'object',
                    properties: {},
                    required: [],
                    additionalProperties: true
                  },
                  identity: {
                    type: 'object',
                    properties: {},
                    required: [],
                    additionalProperties: true
                  },
                  initialState: {
                    type: 'object',
                    properties: {},
                    required: [],
                    additionalProperties: true
                  },
                  transitions: {
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
                required: [ 'reactions', 'identity', 'initialState', 'transitions' ],
                additionalProperties: false
              },
              {
                type: 'object',
                properties: {
                  reactions: {
                    type: 'object',
                    properties: {},
                    required: [],
                    additionalProperties: true
                  }
                },
                required: [ 'reactions' ],
                additionalProperties: false
              }
            ]
          }
        },
        minProperties: 0
      }
    },
    required: [ 'domain', 'views', 'flows' ],
    additionalProperties: true
  });

  value.validate(applicationConfiguration, { valueName: './server', separator: '/' });

  return applicationConfiguration as ApplicationConfiguration;
};

export default validateApplicationConfiguration;
