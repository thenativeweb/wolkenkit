'use strict';

const path = require('path');

const assert = require('assertthat');

const { Application } = require('../../../../common/application'),
      invalidAggregatesAreMissing = require('../../../shared/applications/invalid/aggregatesAreMissing'),
      invalidContextsAreMissing = require('../../../shared/applications/invalid/contextsAreMissing'),
      invalidFlowsAreMissing = require('../../../shared/applications/invalid/flowsAreMissing'),
      invalidListsAreMissing = require('../../../shared/applications/invalid/listsAreMissing'),
      invalidReadModelIsMissing = require('../../../shared/applications/invalid/readModelIsMissing'),
      invalidWithDirectoriesAndWrongFileName = require('../../../shared/applications/invalid/withDirectoriesAndWrongFileName'),
      invalidWithWrongRequire = require('../../../shared/applications/invalid/withWrongRequire'),
      invalidWriteModelIsMissing = require('../../../shared/applications/invalid/writeModelIsMissing'),
      validWithDirectories = require('../../../shared/applications/valid/withDirectories'),
      validWithDirectoriesWithoutIndex = require('../../../shared/applications/valid/withDirectoriesWithoutIndex'),
      validWithDocumentation = require('../../../shared/applications/valid/withDocumentation'),
      validWithFilter = require('../../../shared/applications/valid/withFilter'),
      validWithFlows = require('../../../shared/applications/valid/withFlows'),
      validWithMap = require('../../../shared/applications/valid/withMap'),
      validWithoutFlows = require('../../../shared/applications/valid/withoutFlows'),
      validWithoutLists = require('../../../shared/applications/valid/withoutLists');

suite('Application', () => {
  test('is a function.', async () => {
    assert.that(Application).is.ofType('function');
  });

  suite('validate', () => {
    test('is a function.', async () => {
      assert.that(Application.validate).is.ofType('function');
    });

    test('throws an error if the directory is missing.', async () => {
      await assert.that(async () => {
        await Application.validate({});
      }).is.throwingAsync('Directory is missing.');
    });

    test('throws an error if the directory does not exist.', async () => {
      await assert.that(async () => {
        await Application.validate({ directory: path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'non-existent-application') });
      }).is.throwingAsync(ex => ex.code === 'ENOENT');
    });

    test('does not throw an error if the directory exists.', async () => {
      await assert.that(async () => {
        await Application.validate({ directory: path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base') });
      }).is.not.throwingAsync();
    });
  });

  suite('load', () => {
    test('is a function.', async () => {
      assert.that(Application.load).is.ofType('function');
    });

    test('throws an error if the directory is missing.', async () => {
      await assert.that(async () => {
        await Application.load({});
      }).is.throwingAsync('Directory is missing.');
    });

    test('throws an error if the directory does not exist.', async () => {
      await assert.that(async () => {
        await Application.load({ directory: path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'non-existent-application') });
      }).is.throwingAsync(ex => ex.code === 'ENOENT');
    });

    test('returns the same instance if called twice with the same application directory.', async () => {
      const application1 = await Application.load({
        directory: path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base')
      });
      const application2 = await Application.load({
        directory: path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base')
      });

      assert.that(application1).is.sameAs(application2);
    });

    suite('valid', () => {
      test('loads applications without flows.', async () => {
        const directory = await validWithoutFlows();
        const application = await Application.load({ directory });

        assert.that(application.configuration).is.equalTo({
          writeModel: {
            sampleContext: {
              sampleAggregate: {
                commands: {
                  execute: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  }
                },
                events: {
                  succeeded: {
                    documentation: undefined,
                    schema: undefined
                  },
                  executed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  },
                  executeFailed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  },
                  executeRejected: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  }
                }
              }
            }
          },
          readModel: {
            lists: {
              sampleList: {}
            }
          },
          flows: {}
        });

        assert.that(application.writeModel).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              initialState: {},
              commands: {
                execute: {}
              },
              events: {
                succeeded: {},
                executed: {},
                executeFailed: {},
                executeRejected: {}
              }
            }
          }
        });

        assert.that(application.readModel).is.atLeast({
          lists: {
            sampleList: {
              fields: {
                createdAt: { initialState: 0 },
                updatedAt: { initialState: undefined },
                strategy: { initialState: '' }
              },
              projections: {},
              queries: {
                readItem: {}
              }
            }
          }
        });

        assert.that(application.flows).is.equalTo({});

        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.isAuthorized).is.ofType('function');

        assert.that(application.readModel.lists.sampleList.projections['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.readModel.lists.sampleList.queries.readItem.isAuthorized).is.ofType('function');
      });

      test('loads applications without lists.', async () => {
        const directory = await validWithoutLists();
        const application = await Application.load({ directory });

        assert.that(application.configuration).is.equalTo({
          writeModel: {
            sampleContext: {
              sampleAggregate: {
                commands: {
                  execute: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  }
                },
                events: {
                  succeeded: {
                    documentation: undefined,
                    schema: undefined
                  },
                  executed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  },
                  executeFailed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  },
                  executeRejected: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  }
                }
              }
            }
          },
          readModel: {
            lists: {}
          },
          flows: {}
        });

        assert.that(application.writeModel).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              initialState: {},
              commands: {
                execute: {}
              },
              events: {
                succeeded: {},
                executed: {},
                executeFailed: {},
                executeRejected: {}
              }
            }
          }
        });

        assert.that(application.readModel).is.equalTo({
          lists: {}
        });

        assert.that(application.flows).is.equalTo({});

        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.isAuthorized).is.ofType('function');
      });

      test('loads applications with flows.', async () => {
        const directory = await validWithFlows();
        const application = await Application.load({ directory });

        assert.that(application.configuration).is.equalTo({
          writeModel: {
            sampleContext: {
              sampleAggregate: {
                commands: {
                  execute: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  }
                },
                events: {
                  succeeded: {
                    documentation: undefined,
                    schema: undefined
                  },
                  executed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  },
                  executeFailed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  },
                  executeRejected: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  }
                }
              }
            }
          },
          readModel: {
            lists: {
              sampleList: {}
            }
          },
          flows: {
            stateless: {},
            stateful: {}
          }
        });

        assert.that(application.writeModel).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              initialState: {},
              commands: {
                execute: {}
              },
              events: {
                succeeded: {},
                executed: {},
                executeFailed: {},
                executeRejected: {}
              }
            }
          }
        });

        assert.that(application.readModel).is.atLeast({
          lists: {
            sampleList: {
              fields: {
                createdAt: { initialState: 0 },
                updatedAt: { initialState: undefined },
                strategy: { initialState: '' }
              },
              projections: {},
              queries: {
                readItem: {}
              }
            }
          }
        });

        assert.that(application.flows).is.atLeast({
          stateless: {
            reactions: {}
          },
          stateful: {
            identity: {},
            initialState: {
              is: 'pristine'
            },
            transitions: {
              pristine: {}
            },
            reactions: {
              pristine: {}
            }
          }
        });

        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.isAuthorized).is.ofType('function');

        assert.that(application.readModel.lists.sampleList.projections['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.readModel.lists.sampleList.queries.readItem.isAuthorized).is.ofType('function');

        assert.that(application.flows.stateless.reactions['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.stateless.reactions['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.stateful.identity['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.stateful.identity['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.stateful.transitions.pristine['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.stateful.transitions.pristine['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.stateful.reactions.pristine['another-state']).is.ofType('function');
      });

      test('loads applications with directories.', async () => {
        const directory = await validWithDirectories();
        const application = await Application.load({ directory });

        assert.that(application.configuration).is.equalTo({
          writeModel: {
            sampleContext: {
              sampleAggregate: {
                commands: {
                  execute: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  }
                },
                events: {
                  succeeded: {
                    documentation: undefined,
                    schema: undefined
                  },
                  executed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  },
                  executeFailed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  },
                  executeRejected: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  }
                }
              }
            }
          },
          readModel: {
            lists: {
              sampleList: {}
            }
          },
          flows: {
            stateless: {},
            stateful: {}
          }
        });

        assert.that(application.writeModel).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              initialState: {},
              commands: {
                execute: {}
              },
              events: {
                succeeded: {},
                executed: {},
                executeFailed: {},
                executeRejected: {}
              }
            }
          }
        });

        assert.that(application.readModel).is.atLeast({
          lists: {
            sampleList: {
              fields: {
                createdAt: { initialState: 0 },
                updatedAt: { initialState: undefined },
                strategy: { initialState: '' }
              },
              projections: {},
              queries: {
                readItem: {}
              }
            }
          }
        });

        assert.that(application.flows).is.atLeast({
          stateless: {
            reactions: {}
          },
          stateful: {
            identity: {},
            initialState: {
              is: 'pristine'
            },
            transitions: {
              pristine: {}
            },
            reactions: {
              pristine: {}
            }
          }
        });

        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.isAuthorized).is.ofType('function');

        assert.that(application.readModel.lists.sampleList.projections['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.readModel.lists.sampleList.queries.readItem.isAuthorized).is.ofType('function');

        assert.that(application.flows.stateless.reactions['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.stateless.reactions['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.stateful.identity['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.stateful.identity['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.stateful.transitions.pristine['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.stateful.transitions.pristine['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.stateful.reactions.pristine['another-state']).is.ofType('function');
      });

      test('loads applications with directories, without index.js files.', async () => {
        const directory = await validWithDirectoriesWithoutIndex();
        const application = await Application.load({ directory });

        assert.that(application.configuration).is.equalTo({
          writeModel: {
            sampleContext: {
              sampleAggregate: {
                commands: {
                  execute: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  }
                },
                events: {
                  succeeded: {
                    documentation: undefined,
                    schema: undefined
                  },
                  executed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                      },
                      required: [ 'strategy' ],
                      additionalProperties: false
                    }
                  },
                  executeFailed: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  },
                  executeRejected: {
                    documentation: undefined,
                    schema: {
                      type: 'object',
                      properties: {
                        reason: { type: 'string' }
                      },
                      required: [ 'reason' ],
                      additionalProperties: false
                    }
                  }
                }
              }
            }
          },
          readModel: {
            lists: {
              sampleList: {}
            }
          },
          flows: {
            stateless: {},
            stateful: {}
          }
        });

        assert.that(application.writeModel).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              initialState: {},
              commands: {
                execute: {}
              },
              events: {
                succeeded: {},
                executed: {},
                executeFailed: {},
                executeRejected: {}
              }
            }
          }
        });

        assert.that(application.readModel).is.atLeast({
          lists: {
            sampleList: {
              fields: {
                createdAt: { initialState: 0 },
                updatedAt: { initialState: undefined },
                strategy: { initialState: '' }
              },
              projections: {},
              queries: {
                readItem: {}
              }
            }
          }
        });

        assert.that(application.flows).is.atLeast({
          stateless: {
            reactions: {}
          },
          stateful: {
            identity: {},
            initialState: {
              is: 'pristine'
            },
            transitions: {
              pristine: {}
            },
            reactions: {
              pristine: {}
            }
          }
        });

        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.commands.execute.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.succeeded.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeFailed.isAuthorized).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.handle).is.ofType('function');
        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executeRejected.isAuthorized).is.ofType('function');

        assert.that(application.readModel.lists.sampleList.projections['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.readModel.lists.sampleList.queries.readItem.isAuthorized).is.ofType('function');

        assert.that(application.flows.stateless.reactions['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.stateless.reactions['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.stateful.identity['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.stateful.identity['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.stateful.transitions.pristine['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.stateful.transitions.pristine['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.stateful.reactions.pristine['another-state']).is.ofType('function');
      });

      test('loads applications with documentation.', async () => {
        const directory = await validWithDocumentation();
        const application = await Application.load({ directory });

        assert.that(application.configuration.writeModel.sampleContext.sampleAggregate.commands.execute.documentation).
          is.equalTo('# Sample aggregate\n\n## Execute');
        assert.that(application.configuration.writeModel.sampleContext.sampleAggregate.events.executed.documentation).
          is.equalTo('# Sample aggregate\n\n## Executed');
      });

      test('loads applications with filter.', async () => {
        const directory = await validWithFilter();
        const application = await Application.load({ directory });

        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.filter).
          is.ofType('function');
        assert.that(application.readModel.lists.sampleList.queries.readItem.filter).
          is.ofType('function');
      });

      test('loads applications with map.', async () => {
        const directory = await validWithMap();
        const application = await Application.load({ directory });

        assert.that(application.writeModel.sampleContext.sampleAggregate.events.executed.map).
          is.ofType('function');
        assert.that(application.readModel.lists.sampleList.queries.readItem.map).
          is.ofType('function');
      });
    });

    suite('invalid', () => {
      test('throws an error if write model is missing.', async () => {
        const directory = await invalidWriteModelIsMissing();

        await assert.that(async () => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: writeModel (at ./server/writeModel).');
      });

      test('throws an error if contexts are missing.', async () => {
        const directory = await invalidContextsAreMissing();

        await assert.that(async () => {
          await Application.load({ directory });
        }).is.throwingAsync('Too few properties defined (0), minimum 1 (at ./server/writeModel).');
      });

      test('throws an error if aggregates are missing.', async () => {
        const directory = await invalidAggregatesAreMissing();

        await assert.that(async () => {
          await Application.load({ directory });
        }).is.throwingAsync('Too few properties defined (0), minimum 1 (at ./server/writeModel/sampleContext).');
      });

      test('throws an error if file names are wrong.', async () => {
        const directory = await invalidWithDirectoriesAndWrongFileName();

        await assert.that(async () => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: initialState (at ./server/writeModel/sampleContext/sampleAggregate/initialState).');
      });

      test('throws an error if a require is wrong.', async () => {
        const directory = await invalidWithWrongRequire();

        await assert.that(async () => {
          await Application.load({ directory });
        }).is.throwingAsync(`Cannot find module 'non-existent'`);
      });

      test('throws an error if read model is missing.', async () => {
        const directory = await invalidReadModelIsMissing();

        await assert.that(async () => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: readModel (at ./server/readModel).');
      });

      test('throws an error if lists are missing.', async () => {
        const directory = await invalidListsAreMissing();

        await assert.that(async () => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: lists (at ./server/readModel/lists).');
      });

      test('throws an error if flows are missing.', async () => {
        const directory = await invalidFlowsAreMissing();

        await assert.that(async () => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: flows (at ./server/flows).');
      });
    });
  });
});
