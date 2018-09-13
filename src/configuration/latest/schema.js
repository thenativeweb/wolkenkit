'use strict';

const schema = function () {
  const result = {
    type: 'object',
    properties: {
      application: {
        type: 'string',
        minLength: 1
      },
      runtime: {
        type: 'object',
        properties: {
          version: {
            type: 'string',
            minLength: 1
          }
        },
        additionalProperties: false,
        required: [ 'version' ]
      },
      environments: {
        type: 'object',
        patternProperties: {
          '.*': {
            oneOf: [
              // cli environment
              {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: [ 'cli' ]
                  },
                  api: {
                    type: 'object',
                    properties: {
                      address: {
                        type: 'object',
                        properties: {
                          host: {
                            type: 'string',
                            minLength: 1
                          },
                          port: {
                            type: 'integer'
                          }
                        },
                        additionalProperties: false,
                        required: [ 'host', 'port' ]
                      },
                      allowAccessFrom: {
                        oneOf: [
                          {
                            type: 'string',
                            minLength: 1
                          }, {
                            type: 'array',
                            minItems: 1,
                            items: {
                              type: 'string',
                              minLength: 1
                            },
                            uniqueItems: true
                          }
                        ]
                      },
                      certificate: {
                        type: 'string',
                        minLength: 1
                      }
                    },
                    additionalProperties: false,
                    required: [ 'address', 'allowAccessFrom' ]
                  },
                  node: {
                    type: 'object',
                    properties: {
                      environment: {
                        type: 'string',
                        minLength: 1
                      }
                    },
                    additionalProperties: false,
                    required: [ 'environment' ]
                  },
                  identityProvider: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        minLength: 1
                      },
                      certificate: {
                        type: 'string',
                        minLength: 1
                      }
                    },
                    required: [
                      'name', 'certificate'
                    ],
                    additionalProperties: false
                  },
                  docker: {
                    type: 'object',
                    properties: {
                      machine: {
                        type: 'string',
                        minLength: 1
                      }
                    },
                    required: [ 'machine' ],
                    additionalProperties: false
                  },
                  environmentVariables: {
                    type: 'object',
                    patternProperties: {
                      '.*': {
                        type: [ 'integer', 'number', 'string', 'boolean' ]
                      }
                    },
                    additionalProperties: false
                  }
                },
                required: [ 'api' ],
                additionalProperties: false
              },

              // aufwind environment
              {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: [ 'aufwind' ]
                  },
                  deployment: {
                    type: 'object',
                    properties: {
                      server: {
                        type: 'object',
                        properties: {
                          host: {
                            type: 'string',
                            minLength: 1
                          },
                          port: {
                            type: 'integer'
                          }
                        },
                        additionalProperties: false,
                        required: [ 'host', 'port' ]
                      },
                      provider: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                            minLength: 1
                          }
                        },
                        additionalProperties: false,
                        required: [ 'name' ]
                      }
                    },
                    additionalProperties: false,
                    required: []
                  },
                  infrastructure: {
                    type: 'object',
                    properties: {
                      writeModel: {
                        type: 'object',
                        properties: {
                          eventStore: {
                            type: 'object',
                            properties: {
                              type: {
                                type: 'string',
                                enum: [ 'postgres' ]
                              },
                              url: {
                                type: 'string',
                                minLength: 1
                              }
                            },
                            additionalProperties: false,
                            required: [ 'type', 'url' ]
                          }
                        },
                        additionalProperties: false,
                        required: [ 'eventStore' ]
                      },
                      readModel: {
                        type: 'object',
                        properties: {
                          listStore: {
                            type: 'object',
                            properties: {
                              type: {
                                type: 'string',
                                enum: [ 'mongo' ]
                              },
                              url: {
                                type: 'string',
                                minLength: 1
                              }
                            },
                            additionalProperties: false,
                            required: [ 'type', 'url' ]
                          }
                        },
                        additionalProperties: false,
                        required: [ 'listStore' ]
                      },
                      messaging: {
                        type: 'object',
                        properties: {
                          commandBus: {
                            type: 'object',
                            properties: {
                              type: {
                                type: 'string',
                                enum: [ 'rabbitmq' ]
                              },
                              url: {
                                type: 'string',
                                minLength: 1
                              }
                            },
                            additionalProperties: false,
                            required: [ 'type', 'url' ]
                          },
                          eventBus: {
                            type: 'object',
                            properties: {
                              type: {
                                type: 'string',
                                enum: [ 'rabbitmq' ]
                              },
                              url: {
                                type: 'string',
                                minLength: 1
                              }
                            },
                            additionalProperties: false,
                            required: [ 'type', 'url' ]
                          },
                          flowBus: {
                            type: 'object',
                            properties: {
                              type: {
                                type: 'string',
                                enum: [ 'rabbitmq' ]
                              },
                              url: {
                                type: 'string',
                                minLength: 1
                              }
                            },
                            additionalProperties: false,
                            required: [ 'type', 'url' ]
                          }
                        },
                        additionalProperties: false,
                        required: [ 'commandBus', 'eventBus', 'flowBus' ]
                      }
                    },
                    additionalProperties: false,
                    required: [ 'writeModel', 'readModel', 'messaging' ]
                  },
                  api: {
                    type: 'object',
                    properties: {
                      certificate: {
                        type: 'string',
                        minLength: 1
                      },
                      allowAccessFrom: {
                        oneOf: [
                          {
                            type: 'string',
                            minLength: 1
                          }, {
                            type: 'array',
                            minItems: 1,
                            items: {
                              type: 'string',
                              minLength: 1
                            },
                            uniqueItems: true
                          }
                        ]
                      },
                      customDomain: {
                        type: 'string',
                        format: 'hostname',
                        minLength: 1
                      }
                    },
                    additionalProperties: false,
                    required: [ 'allowAccessFrom' ]
                  },
                  identityProvider: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        minLength: 1
                      },
                      certificate: {
                        type: 'string',
                        minLength: 1
                      }
                    },
                    required: [
                      'name', 'certificate'
                    ],
                    additionalProperties: false
                  },
                  node: {
                    type: 'object',
                    properties: {
                      environment: {
                        type: 'string',
                        minLength: 1
                      }
                    },
                    additionalProperties: false,
                    required: [ 'environment' ]
                  },
                  environmentVariables: {
                    type: 'object',
                    patternProperties: {
                      '.*': {
                        type: [ 'integer', 'number', 'string', 'boolean' ]
                      }
                    },
                    additionalProperties: false
                  }
                },
                required: [
                  'type', 'deployment', 'api'
                ],
                additionalProperties: false
              }
            ]
          }
        },
        minProperties: 1,
        additionalProperties: false
      }
    },
    required: [
      'application', 'runtime', 'environments'
    ],
    additionalProperties: false
  };

  return result;
};

module.exports = schema;
