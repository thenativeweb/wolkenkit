import { assert } from 'assertthat';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';

suite('getApplicationDescription', (): void => {
  test('returns an application description from the given application definition.', async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });
    const applicationDefinition = await getApplicationDefinition({ applicationDirectory });
    const applicationDescription = getApplicationDescription({ applicationDefinition });

    assert.that(applicationDescription).is.equalTo({
      commands: {
        sampleContext: {
          sampleAggregate: {
            authenticate: {
              schema: {
                type: 'object',
                properties: {
                  allowAnonymous: {
                    type: 'boolean'
                  }
                },
                required: [
                  'allowAnonymous'
                ],
                additionalProperties: false
              }
            },
            authorize: {
              schema: {
                type: 'object',
                properties: {
                  shouldAuthorize: { type: 'boolean' }
                },
                required: [ 'shouldAuthorize' ],
                additionalProperties: false
              }
            },
            execute: {
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
      },
      domainEvents: {
        sampleContext: {
          sampleAggregate: {
            authenticated: {
              schema: {
                type: 'object',
                properties: {},
                additionalProperties: false
              }
            },
            authorized: {
              schema: {
                type: 'object',
                properties: {},
                additionalProperties: false
              }
            },
            succeeded: {
              schema: {
                type: 'object',
                properties: {},
                additionalProperties: false
              }
            },
            executed: {
              schema: {
                type: 'object',
                properties: {
                  strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                },
                required: [ 'strategy' ],
                additionalProperties: false
              }
            },
            authenticateFailed: {
              schema: {
                type: 'object',
                properties: {
                  reason: {
                    type: 'string'
                  }
                },
                required: [
                  'reason'
                ],
                additionalProperties: false
              }
            },
            authenticateRejected: {
              schema: {
                type: 'object',
                properties: {
                  reason: {
                    type: 'string'
                  }
                },
                required: [
                  'reason'
                ],
                additionalProperties: false
              }
            },
            authorizeFailed: {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string' }
                },
                required: [ 'reason' ],
                additionalProperties: false
              }
            },
            authorizeRejected: {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string' }
                },
                required: [ 'reason' ],
                additionalProperties: false
              }
            },
            executeFailed: {
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
      },
      views: {
        sampleView: {
          queries: {
            all: {
              documentation: undefined,
              optionsSchema: undefined,
              itemSchema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  createdAt: { type: 'number' },
                  updatedAt: { type: 'number' },
                  strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
                },
                required: [ 'id', 'createdAt', 'strategy' ],
                additionalProperties: false
              }
            }
          }
        }
      }
    });
  });
});
