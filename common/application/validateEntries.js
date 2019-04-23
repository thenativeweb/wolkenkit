'use strict';

const Value = require('validate-value');

const validateStructure = async function ({ entries }) {
  if (!entries) {
    throw new Error('Entries are missing.');
  }

  const value = new Value({
    type: 'object',
    properties: {
      server: {
        type: 'object',
        properties: {
          writeModel: {
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
          readModel: {
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
        required: [ 'writeModel', 'readModel', 'flows' ],
        additionalProperties: true
      }
    },
    required: [ 'server' ],
    additionalProperties: true
  });

  value.validate(entries, { valueName: '.', separator: '/' });
};

module.exports = validateStructure;
