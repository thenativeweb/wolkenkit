'use strict';

const path = require('path');

const assert = require('assertthat');

const applicationManager = require('../../../../../common/application/applicationManager');

suite('[common/application] validWithoutLists', () => {
  test('gets loaded correctly.', async () => {
    const application = await applicationManager.load({
      directory: path.join(__dirname, '..', '..', '..', '..', 'shared', 'common', 'application', 'validWithoutLists')
    });

    assert.that(application.configuration).is.equalTo({
      writeModel: {
        planning: {
          peerGroup: {
            commands: {
              start: {
                documentation: undefined,
                schema: undefined
              },
              join: {
                documentation: '# Joining a peer group\n\nThe `join` command lets you join a peer group.',
                schema: {
                  type: 'object',
                  properties: {},
                  required: [],
                  additionalProperties: true
                }
              }
            },
            events: {
              started: {
                documentation: undefined,
                schema: undefined
              },
              joined: {
                documentation: '# Having joined a peer group\n\nThe `joined` event notifies you when a participant joined a peer group.',
                schema: {
                  type: 'object',
                  properties: {},
                  required: [],
                  additionalProperties: true
                }
              },
              startFailed: {
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
              startRejected: {
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
              joinFailed: {
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
              joinRejected: {
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
      flows: {
        stateful: {},
        stateless: {}
      }
    });

    assert.that(application.writeModel).is.atLeast({
      planning: {
        peerGroup: {
          initialState: {
            foo: 'bar'
          },
          commands: {
            start: {},
            join: {}
          },
          events: {
            started: {},
            startFailed: {},
            startRejected: {},
            joined: {},
            joinFailed: {},
            joinRejected: {}
          }
        }
      }
    });

    assert.that(application.readModel).is.atLeast({
      lists: {}
    });

    assert.that(application.flows).is.atLeast({
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
      },
      stateless: {
        reactions: {}
      }
    });

    assert.that(application.writeModel.planning.peerGroup.commands.start.isAuthorized).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.commands.start.handle).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.commands.join.isAuthorized).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.commands.join.handle).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.started.handle).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.started.isAuthorized).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.startFailed.handle).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.startFailed.isAuthorized).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.startRejected.handle).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.startRejected.isAuthorized).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.joined.handle).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.joined.isAuthorized).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.joined.filter).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.joined.map).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.joinFailed.handle).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.joinFailed.isAuthorized).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.joinRejected.handle).is.ofType('function');
    assert.that(application.writeModel.planning.peerGroup.events.joinRejected.isAuthorized).is.ofType('function');

    assert.that(application.flows.stateless.reactions['planning.peerGroup.started']).is.ofType('function');
    assert.that(application.flows.stateless.reactions['planning.peerGroup.joined']).is.ofType('function');
    assert.that(application.flows.stateful.identity['planning.peerGroup.started']).is.ofType('function');
    assert.that(application.flows.stateful.identity['planning.peerGroup.joined']).is.ofType('function');
    assert.that(application.flows.stateful.transitions.pristine['planning.peerGroup.started']).is.ofType('function');
    assert.that(application.flows.stateful.transitions.pristine['planning.peerGroup.joined']).is.ofType('function');
    assert.that(application.flows.stateful.reactions.pristine['another-state']).is.ofType('function');
  });
});
