"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addRouteToPaths_1 = require("../../../../lib/apis/openApi/addRouteToPaths");
const assertthat_1 = require("assertthat");
suite('addRouteToPaths', () => {
    test('adds a route object to a paths object.', async () => {
        const paths = {};
        const basePath = 'base-path';
        const route = {
            description: 'foo',
            path: ':bar/baz',
            request: {
                query: {
                    type: 'object',
                    properties: {
                        uiae: { type: 'string' },
                        eaui: { type: 'string' }
                    },
                    required: ['uiae']
                },
                body: {
                    type: 'object'
                }
            },
            response: {
                statusCodes: [200],
                body: {
                    type: 'object',
                    properties: {
                        result: { type: 'string' }
                    },
                    required: ['result']
                }
            }
        };
        addRouteToPaths_1.addRouteToPaths({ route, method: 'post', basePath, tags: ['foo'], paths });
        assertthat_1.assert.that(paths).is.equalTo({
            [`/${basePath}/{bar}/baz`]: {
                post: {
                    summary: 'foo',
                    tags: ['foo'],
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
//# sourceMappingURL=addRouteToPathsTests.js.map