import Application from '../../../../src/common/application';
import assert from 'assertthat';
import { CustomError } from '@offspring/defekt';
import invalidAggregatesAreMissing from '../../../shared/applications/invalid/aggregatesAreMissing';
import invalidContextsAreMissing from '../../../shared/applications/invalid/contextsAreMissing';
import invalidDomainIsMissing from '../../../shared/applications/invalid/domainIsMissing';
import invalidFlowsAreMissing from '../../../shared/applications/invalid/flowsAreMissing';
import invalidListsAreMissing from '../../../shared/applications/invalid/listsAreMissing';
import invalidViewsAreMissing from '../../../shared/applications/invalid/viewsAreMissing';
import invalidWithDirectoriesAndWrongFileName from '../../../shared/applications/invalid/withDirectoriesAndWrongFileName';
import invalidWithWrongRequire from '../../../shared/applications/invalid/withWrongRequire';
import path from 'path';
import validWithDirectories from '../../../shared/applications/valid/withDirectories';
import validWithDirectoriesWithoutIndex from '../../../shared/applications/valid/withDirectoriesWithoutIndex';
import validWithDocumentation from '../../../shared/applications/valid/withDocumentation';
import validWithFilter from '../../../shared/applications/valid/withFilter';
import validWithFlows from '../../../shared/applications/valid/withFlows';
import validWithMap from '../../../shared/applications/valid/withMap';
import validWithoutFlows from '../../../shared/applications/valid/withoutFlows';
import validWithoutLists from '../../../shared/applications/valid/withoutLists';

suite('Application', (): void => {
  suite('load', (): void => {
    test('throws an error if the directory does not exist.', async (): Promise<void> => {
      await assert.that(async (): Promise<void> => {
        await Application.load({ directory: path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'non-existent-application') });
      }).is.throwingAsync((ex: Error): boolean => (ex as CustomError).code === 'ENOENT');
    });

    test('returns the same instance if called twice with the same application directory.', async (): Promise<void> => {
      const application1 = await Application.load({
        directory: path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base')
      });
      const application2 = await Application.load({
        directory: path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base')
      });

      assert.that(application1).is.sameAs(application2);
    });

    suite('valid', (): void => {
      test('loads applications without flows.', async (): Promise<void> => {
        const directory = await validWithoutFlows();
        const application = await Application.load({ directory });

        assert.that(application.commands.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
            }
          }
        });

        assert.that(application.events.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
        });

        assert.that(application.views.external).is.equalTo({
          lists: {
            sampleList: {}
          }
        });

        assert.that(application.initialState.internal).is.equalTo({
          sampleContext: {
            sampleAggregate: {}
          }
        });

        assert.that(application.commands.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              execute: {}
            }
          }
        });

        assert.that(application.events.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              succeeded: {},
              executed: {},
              executeFailed: {},
              executeRejected: {}
            }
          }
        });

        assert.that(application.views.internal).is.atLeast({
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

        assert.that(application.flows.internal).is.equalTo({});

        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.isAuthorized).is.ofType('function');
        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.handle).is.ofType('function');

        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.isAuthorized).is.ofType('function');

        assert.that(application.views.internal.lists!.sampleList!.projections['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.views.internal.lists!.sampleList!.queries.readItem.isAuthorized).is.ofType('function');
      });

      test('loads applications without lists.', async (): Promise<void> => {
        const directory = await validWithoutLists();
        const application = await Application.load({ directory });

        assert.that(application.commands.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
            }
          }
        });

        assert.that(application.events.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
        });

        assert.that(application.views.external).is.equalTo({
          lists: {}
        });

        assert.that(application.initialState.internal).is.equalTo({
          sampleContext: {
            sampleAggregate: {}
          }
        });

        assert.that(application.commands.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              execute: {}
            }
          }
        });

        assert.that(application.events.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              succeeded: {},
              executed: {},
              executeFailed: {},
              executeRejected: {}
            }
          }
        });

        assert.that(application.views.internal).is.atLeast({
          lists: {}
        });

        assert.that(application.flows.internal).is.equalTo({});

        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.isAuthorized).is.ofType('function');
        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.handle).is.ofType('function');

        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.isAuthorized).is.ofType('function');
      });

      test('loads applications with flows.', async (): Promise<void> => {
        const directory = await validWithFlows();
        const application = await Application.load({ directory });

        assert.that(application.commands.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
            }
          }
        });

        assert.that(application.events.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
        });

        assert.that(application.views.external).is.equalTo({
          lists: {
            sampleList: {}
          }
        });

        assert.that(application.initialState.internal).is.equalTo({
          sampleContext: {
            sampleAggregate: {}
          }
        });

        assert.that(application.commands.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              execute: {}
            }
          }
        });

        assert.that(application.events.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              succeeded: {},
              executed: {},
              executeFailed: {},
              executeRejected: {}
            }
          }
        });

        assert.that(application.views.internal).is.atLeast({
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

        assert.that(application.flows.internal).is.atLeast({
          stateful: {
            identity: {},
            initialState: { is: 'pristine' },
            transitions: { pristine: {}},
            reactions: { pristine: {}}
          },
          stateless: {
            reactions: {}
          }
        });

        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.isAuthorized).is.ofType('function');
        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.handle).is.ofType('function');

        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.isAuthorized).is.ofType('function');

        assert.that(application.views.internal.lists!.sampleList!.projections['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.views.internal.lists!.sampleList!.queries.readItem.isAuthorized).is.ofType('function');

        assert.that(application.flows.internal.stateless!.reactions['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.internal.stateless!.reactions['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.identity['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.identity['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.transitions.pristine['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.transitions.pristine['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.reactions.pristine['another-state']).is.ofType('function');
      });

      test('loads applications with directories.', async (): Promise<void> => {
        const directory = await validWithDirectories();
        const application = await Application.load({ directory });

        assert.that(application.commands.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
            }
          }
        });

        assert.that(application.events.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
        });

        assert.that(application.views.external).is.equalTo({
          lists: {
            sampleList: {}
          }
        });

        assert.that(application.initialState.internal).is.equalTo({
          sampleContext: {
            sampleAggregate: {}
          }
        });

        assert.that(application.commands.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              execute: {}
            }
          }
        });

        assert.that(application.events.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              succeeded: {},
              executed: {},
              executeFailed: {},
              executeRejected: {}
            }
          }
        });

        assert.that(application.views.internal).is.atLeast({
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

        assert.that(application.flows.internal).is.atLeast({
          stateful: {
            identity: {},
            initialState: { is: 'pristine' },
            transitions: { pristine: {}},
            reactions: { pristine: {}}
          },
          stateless: {
            reactions: {}
          }
        });


        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.isAuthorized).is.ofType('function');
        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.handle).is.ofType('function');

        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.isAuthorized).is.ofType('function');

        assert.that(application.views.internal.lists!.sampleList!.projections['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.views.internal.lists!.sampleList!.queries.readItem.isAuthorized).is.ofType('function');

        assert.that(application.flows.internal.stateless!.reactions['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.internal.stateless!.reactions['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.identity['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.identity['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.transitions.pristine['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.transitions.pristine['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.reactions.pristine['another-state']).is.ofType('function');
      });

      test('loads applications with directories, without index.js files.', async (): Promise<void> => {
        const directory = await validWithDirectoriesWithoutIndex();
        const application = await Application.load({ directory });

        assert.that(application.commands.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
            }
          }
        });

        assert.that(application.events.external).is.equalTo({
          sampleContext: {
            sampleAggregate: {
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
        });

        assert.that(application.views.external).is.equalTo({
          lists: {
            sampleList: {}
          }
        });

        assert.that(application.initialState.internal).is.equalTo({
          sampleContext: {
            sampleAggregate: {}
          }
        });

        assert.that(application.commands.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              execute: {}
            }
          }
        });

        assert.that(application.events.internal).is.atLeast({
          sampleContext: {
            sampleAggregate: {
              succeeded: {},
              executed: {},
              executeFailed: {},
              executeRejected: {}
            }
          }
        });

        assert.that(application.views.internal).is.atLeast({
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

        assert.that(application.flows.internal).is.atLeast({
          stateful: {
            identity: {},
            initialState: { is: 'pristine' },
            transitions: { pristine: {}},
            reactions: { pristine: {}}
          },
          stateless: {
            reactions: {}
          }
        });


        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.isAuthorized).is.ofType('function');
        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.handle).is.ofType('function');

        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.succeeded!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeFailed!.isAuthorized).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.handle).is.ofType('function');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executeRejected!.isAuthorized).is.ofType('function');

        assert.that(application.views.internal.lists!.sampleList!.projections['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.views.internal.lists!.sampleList!.queries.readItem.isAuthorized).is.ofType('function');

        assert.that(application.flows.internal.stateless!.reactions['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.internal.stateless!.reactions['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.identity['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.identity['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.transitions.pristine['sampleContext.sampleAggregate.succeeded']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.transitions.pristine['sampleContext.sampleAggregate.executed']).is.ofType('function');
        assert.that(application.flows.internal.stateful!.reactions.pristine['another-state']).is.ofType('function');
      });

      test('loads applications with documentation.', async (): Promise<void> => {
        const directory = await validWithDocumentation();
        const application = await Application.load({ directory });

        assert.that(application.commands.internal.sampleContext!.sampleAggregate!.execute!.documentation).
          is.equalTo('# Sample aggregate\n\n## Execute');
        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.documentation).
          is.equalTo('# Sample aggregate\n\n## Executed');

        assert.that(application.commands.external.sampleContext!.sampleAggregate!.execute!.documentation).
          is.equalTo('# Sample aggregate\n\n## Execute');
        assert.that(application.events.external.sampleContext!.sampleAggregate!.executed!.documentation).
          is.equalTo('# Sample aggregate\n\n## Executed');
      });

      test('loads applications with filter.', async (): Promise<void> => {
        const directory = await validWithFilter();
        const application = await Application.load({ directory });

        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.filter).
          is.ofType('function');
        assert.that(application.views.internal.lists!.sampleList!.queries.readItem.filter).
          is.ofType('function');
      });

      test('loads applications with map.', async (): Promise<void> => {
        const directory = await validWithMap();
        const application = await Application.load({ directory });

        assert.that(application.events.internal.sampleContext!.sampleAggregate!.executed!.map).
          is.ofType('function');
        assert.that(application.views.internal.lists!.sampleList!.queries.readItem.map).
          is.ofType('function');
      });
    });

    suite('invalid', (): void => {
      test('throws an error if domain is missing.', async (): Promise<void> => {
        const directory = await invalidDomainIsMissing();

        await assert.that(async (): Promise<void> => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: domain (at ./server/domain).');
      });

      test('throws an error if contexts are missing.', async (): Promise<void> => {
        const directory = await invalidContextsAreMissing();

        await assert.that(async (): Promise<void> => {
          await Application.load({ directory });
        }).is.throwingAsync('Too few properties defined (0), minimum 1 (at ./server/domain).');
      });

      test('throws an error if aggregates are missing.', async (): Promise<void> => {
        const directory = await invalidAggregatesAreMissing();

        await assert.that(async (): Promise<void> => {
          await Application.load({ directory });
        }).is.throwingAsync('Too few properties defined (0), minimum 1 (at ./server/domain/sampleContext).');
      });

      test('throws an error if file names are wrong.', async (): Promise<void> => {
        const directory = await invalidWithDirectoriesAndWrongFileName();

        await assert.that(async (): Promise<void> => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: initialState (at ./server/domain/sampleContext/sampleAggregate/initialState).');
      });

      test('throws an error if a require is wrong.', async (): Promise<void> => {
        const directory = await invalidWithWrongRequire();

        await assert.that(async (): Promise<void> => {
          await Application.load({ directory });
        }).is.throwingAsync((ex: any): boolean => ex.code === 'MODULE_NOT_FOUND');
      });

      test('throws an error if views are missing.', async (): Promise<void> => {
        const directory = await invalidViewsAreMissing();

        await assert.that(async (): Promise<void> => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: views (at ./server/views).');
      });

      test('throws an error if lists are missing.', async (): Promise<void> => {
        const directory = await invalidListsAreMissing();

        await assert.that(async (): Promise<void> => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: lists (at ./server/views/lists).');
      });

      test('throws an error if flows are missing.', async (): Promise<void> => {
        const directory = await invalidFlowsAreMissing();

        await assert.that(async (): Promise<void> => {
          await Application.load({ directory });
        }).is.throwingAsync('Missing required property: flows (at ./server/flows).');
      });
    });
  });
});
