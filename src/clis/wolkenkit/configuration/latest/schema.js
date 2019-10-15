'use strict';

const schema = function () {
  const result = {
    type: 'object',
    properties: {
      application: { type: 'string', format: 'alphanumeric', minLength: 1, maxLength: 32 },
      runtime: {
        type: 'object',
        properties: {
          version: { type: 'string', minLength: 1 }
        },
        additionalProperties: false,
        required: [ 'version' ]
      },
      environments: {
        type: 'object',
        patternProperties: {
          '.*': {
            oneOf: [
              // CLI environment
              {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: [ 'cli' ]},
                  api: {
                    type: 'object',
                    properties: {
                      host: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', minLength: 1 },
                          certificate: { type: 'string', minLength: 1 }
                        },
                        required: [ 'name', 'certificate' ],
                        additionalProperties: false
                      },
                      port: { type: 'integer' },
                      allowAccessFrom: {
                        oneOf: [
                          {
                            type: 'string',
                            minLength: 1
                          },
                          {
                            type: 'array',
                            minItems: 1,
                            items: {
                              type: 'string',
                              minLength: 1
                            },
                            uniqueItems: true
                          }
                        ]
                      }
                    },
                    additionalProperties: false,
                    required: [ 'allowAccessFrom' ]
                  },
                  fileStorage: {
                    type: 'object',
                    properties: {
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
                      provider: {
                        oneOf: [
                          {
                            type: 'object',
                            properties: {
                              type: { type: 'string', enum: [ 'fileSystem' ]}
                            },
                            required: [ 'type' ],
                            additionalProperties: false
                          }, {
                            type: 'object',
                            properties: {
                              type: { type: 'string', enum: [ 's3' ]},
                              options: {
                                type: 'object',
                                properties: {
                                  endpoint: { type: 'string', format: 'uri' },
                                  region: { type: 'string', minLength: 1 },
                                  bucketName: { type: 'string', minLength: 1 },
                                  accessKey: { type: 'string', minLength: 1 },
                                  secret: { type: 'string', minLength: 1 }
                                },
                                required: [
                                  'endpoint',
                                  'region',
                                  'bucketName',
                                  'accessKey',
                                  'secret'
                                ],
                                additionalProperties: false
                              }
                            },
                            required: [ 'type', 'options' ],
                            additionalProperties: false
                          }
                        ]
                      },
                      isAuthorized: {
                        properties: {
                          commands: {
                            type: 'object',
                            properties: {
                              addFile: {
                                type: 'object',
                                properties: {
                                  forAuthenticated: { type: 'boolean' },
                                  forPublic: { type: 'boolean' }
                                },
                                additionalProperties: false,
                                required: [ 'forAuthenticated', 'forPublic' ]
                              }
                            },
                            additionalProperties: false,
                            required: [ 'addFile' ]
                          }
                        },
                        additionalProperties: false,
                        required: [ 'commands' ]
                      }
                    },
                    additionalProperties: false,
                    required: [ 'allowAccessFrom', 'provider' ]
                  },
                  node: {
                    type: 'object',
                    properties: {
                      environment: { type: 'string', minLength: 1 }
                    },
                    additionalProperties: false,
                    required: [ 'environment' ]
                  },
                  identityProviders: {
                    type: 'array',
                    items: [
                      {
                        type: 'object',
                        properties: {
                          issuer: { type: 'string', minLength: 1 },
                          certificate: { type: 'string', minLength: 1 }
                        },
                        required: [ 'issuer', 'certificate' ],
                        additionalProperties: false
                      }
                    ],
                    minItems: 1
                  },
                  docker: {
                    type: 'object',
                    properties: {
                      machine: { type: 'string', minLength: 1 }
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
                required: [ 'api', 'fileStorage' ],
                additionalProperties: false
              },

              // Aufwind environment
              {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: [ 'aufwind' ]},
                  deployment: {
                    type: 'object',
                    properties: {
                      server: {
                        type: 'object',
                        properties: {
                          host: { type: 'string', minLength: 1 },
                          port: { type: 'integer' }
                        },
                        additionalProperties: false,
                        required: [ 'host', 'port' ]
                      },
                      provider: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', minLength: 1 }
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
                              type: { type: 'string', enum: [ 'postgres' ]},
                              url: { type: 'string', minLength: 1 }
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
                              type: { type: 'string', enum: [ 'mongo' ]},
                              url: { type: 'string', minLength: 1 }
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
                              type: { type: 'string', enum: [ 'rabbitmq' ]},
                              url: { type: 'string', minLength: 1 }
                            },
                            additionalProperties: false,
                            required: [ 'type', 'url' ]
                          },
                          eventBus: {
                            type: 'object',
                            properties: {
                              type: { type: 'string', enum: [ 'rabbitmq' ]},
                              url: { type: 'string', minLength: 1 }
                            },
                            additionalProperties: false,
                            required: [ 'type', 'url' ]
                          },
                          flowBus: {
                            type: 'object',
                            properties: {
                              type: { type: 'string', enum: [ 'rabbitmq' ]},
                              url: { type: 'string', minLength: 1 }
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
                      host: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', minLength: 1 },
                          certificate: { type: 'string', minLength: 1 }
                        },
                        required: [ 'name', 'certificate' ],
                        additionalProperties: false
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
                      }
                    },
                    additionalProperties: false,
                    required: [ 'allowAccessFrom' ]
                  },
                  identityProvider: {
                    type: 'object',
                    properties: {
                      issuer: { type: 'string', minLength: 1 },
                      certificate: { type: 'string', minLength: 1 }
                    },
                    required: [ 'issuer', 'certificate' ],
                    additionalProperties: false
                  },
                  node: {
                    type: 'object',
                    properties: {
                      environment: { type: 'string', minLength: 1 }
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
                required: [ 'type', 'deployment', 'api' ],
                additionalProperties: false
              }
            ]
          }
        },
        minProperties: 1,
        additionalProperties: false
      }
    },
    required: [ 'application', 'runtime', 'environments' ],
    additionalProperties: false
  };

  return result;
};

module.exports = schema;
