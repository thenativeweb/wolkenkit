import { addRouteToPaths } from '../../../../lib/apis/openApi/addRouteToPaths';
import { assert } from 'assertthat';
import { RouteDefinition } from '../../../../lib/apis/openApi/RouteDefinition';

suite('addRouteToPaths', (): void => {
  test('adds a route object to a paths object.', async (): Promise<void> => {
    const paths = {};

    const basePath = 'base-path';
    const route: RouteDefinition = {
      description: 'foo',
      path: ':bar/baz',
      request: {
        query: {
          type: 'object',
          properties: {
            uiae: { type: 'string' },
            eaui: { type: 'string' }
          },
          required: [ 'uiae' ]
        },
        body: {
          type: 'object'
        }
      },
      response: {
        statusCodes: [ 200 ],
        body: {
          type: 'object',
          properties: {
            result: { type: 'string' }
          },
          required: [ 'result' ]
        }
      }
    };

    addRouteToPaths({ route, method: 'post', basePath, paths });

    assert.that(paths).is.equalTo({
      [`/${basePath}/{bar}/baz`]: {
        post: {
          summary: 'foo',
          parameters: [
            {
              name: 'bar',
              in: 'path',
              required: true,
              type: 'string'
            },
            {
              name: 'uiae',
              in: 'query',
              required: true,
              schema: {
                type: 'string'
              }
            },
            {
              name: 'eaui',
              in: 'query',
              required: false,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      result: {
                        type: 'string'
                      }
                    },
                    required: [
                      'result'
                    ]
                  }
                }
              }
            }
          },
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object'
                }
              }
            }
          }
        }
      }
    });
  });
});
