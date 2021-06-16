"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getApplicationDescription_1 = require("../../../../lib/common/application/getApplicationDescription");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
suite('getApplicationDescription', () => {
    test('returns an application description from the given application definition.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
        const application = await loadApplication_1.loadApplication({ applicationDirectory });
        const applicationDescription = getApplicationDescription_1.getApplicationDescription({ application });
        assertthat_1.assert.that(applicationDescription).is.equalTo({
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
                                required: ['shouldAuthorize'],
                                additionalProperties: false
                            }
                        },
                        execute: {
                            schema: {
                                type: 'object',
                                properties: {
                                    strategy: { type: 'string', enum: ['succeed', 'fail', 'reject'] }
                                },
                                required: ['strategy'],
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
                                    strategy: { type: 'string', enum: ['succeed', 'fail', 'reject'] }
                                },
                                required: ['strategy'],
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
                                required: ['reason'],
                                additionalProperties: false
                            }
                        },
                        authorizeRejected: {
                            schema: {
                                type: 'object',
                                properties: {
                                    reason: { type: 'string' }
                                },
                                required: ['reason'],
                                additionalProperties: false
                            }
                        },
                        executeFailed: {
                            schema: {
                                type: 'object',
                                properties: {
                                    reason: { type: 'string' }
                                },
                                required: ['reason'],
                                additionalProperties: false
                            }
                        },
                        executeRejected: {
                            schema: {
                                type: 'object',
                                properties: {
                                    reason: { type: 'string' }
                                },
                                required: ['reason'],
                                additionalProperties: false
                            }
                        }
                    }
                }
            },
            notifications: {
                commandExecute: {},
                complex: {
                    dataSchema: {
                        type: 'object',
                        properties: {
                            message: { type: 'string', minLength: 1 }
                        },
                        required: ['message']
                    },
                    metadataSchema: {
                        type: 'object',
                        properties: {
                            public: { type: 'boolean' }
                        },
                        required: ['public']
                    }
                },
                flowSampleFlowUpdated: {},
                viewSampleViewUpdated: {}
            },
            views: {
                sampleView: {
                    all: {
                        itemSchema: {
                            type: 'object',
                            properties: {
                                aggregateIdentifier: {
                                    type: 'object',
                                    properties: {
                                        context: {
                                            type: 'object',
                                            properties: {
                                                name: {
                                                    type: 'string',
                                                    minLength: 1
                                                }
                                            },
                                            required: [
                                                'name'
                                            ],
                                            additionalProperties: false
                                        },
                                        aggregate: {
                                            type: 'object',
                                            properties: {
                                                name: {
                                                    type: 'string',
                                                    minLength: 1
                                                },
                                                id: {
                                                    type: 'string'
                                                }
                                            },
                                            required: [
                                                'name',
                                                'id'
                                            ],
                                            additionalProperties: false
                                        }
                                    },
                                    required: ['context', 'aggregate'],
                                    additionalProperties: false
                                },
                                name: {
                                    type: 'string',
                                    minLength: 1
                                },
                                id: {
                                    type: 'string'
                                }
                            },
                            required: [
                                'aggregateIdentifier',
                                'name',
                                'id'
                            ],
                            additionalProperties: false
                        }
                    }
                }
            }
        });
    });
});
//# sourceMappingURL=getApplicationDescriptionTests.js.map