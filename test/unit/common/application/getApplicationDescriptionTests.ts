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
      },
      domainEvents: {
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
