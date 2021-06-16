"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const DomainEvent_1 = require("../../../../lib/common/elements/DomainEvent");
const http_1 = require("../../../../lib/apis/handleDomainEvent/http");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('handleDomainEvent/http', () => {
    let application;
    suite('/v2', () => {
        suiteSetup(async () => {
            const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
            application = await loadApplication_1.loadApplication({ applicationDirectory });
        });
        suite('POST /', () => {
            let api, receivedDomainEvents;
            setup(async () => {
                receivedDomainEvents = [];
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveDomainEvent({ domainEvent }) {
                        receivedDomainEvents.push(domainEvent);
                    },
                    application
                }));
            });
            test('returns 415 if the content-type header is not set to application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/',
                    headers: {
                        'content-type': 'text/plain'
                    },
                    data: 'foobar',
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(415);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.ContentTypeMismatch.code,
                    message: 'Header content-type must be application/json.'
                });
            });
            test('returns 400 if a malformed domain event is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { domainEvent: {} },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: 'Missing required property: aggregateIdentifier (at requestBody.domainEvent.aggregateIdentifier).'
                });
            });
            test('returns 400 if a wellformed domain event is sent with a non-existent context name.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'nonExistent' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { domainEvent: domainEventExecuted },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.ContextNotFound.code,
                    message: `Context 'nonExistent' not found.`
                });
            });
            test('returns 400 if a wellformed domain event is sent with a non-existent aggregate name.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'nonExistent', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { domainEvent: domainEventExecuted },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.AggregateNotFound.code,
                    message: `Aggregate 'sampleContext.nonExistent' not found.`
                });
            });
            test('returns 400 if a wellformed domain event is sent with a non-existent domain event name.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'nonExistent',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { domainEvent: domainEventExecuted },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.DomainEventNotFound.code,
                    message: `Domain event 'sampleContext.sampleAggregate.nonExistent' not found.`
                });
            });
            test('returns 400 if a domain event is sent with a payload that does not match the schema.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'invalidValue' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { domainEvent: domainEventExecuted },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.DomainEventMalformed.code,
                    message: 'No enum match (invalidValue), expects: succeed, fail, reject (at domainEvent.data.strategy).'
                });
            });
            test('returns 400 if a non-existent flow name is sent.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { flowNames: ['nonExistent'], domainEvent: domainEventExecuted },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.FlowNotFound.code,
                    message: `Flow 'nonExistent' not found.`
                });
            });
            test('returns 200 if a wellformed and existing domain event is sent.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { domainEvent: domainEventExecuted }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
            });
            test('returns 200 if a wellformed and existing domain event is sent for a specific flow.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { flowNames: ['sampleFlow'], domainEvent: domainEventExecuted }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
            });
            test('receives domain events.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/',
                    data: { domainEvent: domainEventExecuted }
                });
                assertthat_1.assert.that(receivedDomainEvents.length).is.equalTo(1);
                assertthat_1.assert.that(receivedDomainEvents[0]).is.atLeast({
                    aggregateIdentifier: domainEventExecuted.aggregateIdentifier,
                    name: domainEventExecuted.name,
                    data: domainEventExecuted.data,
                    metadata: {
                        causationId: domainEventExecuted.metadata.causationId,
                        correlationId: domainEventExecuted.metadata.correlationId,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                assertthat_1.assert.that(receivedDomainEvents[0].id).is.ofType('string');
                assertthat_1.assert.that(receivedDomainEvents[0].metadata.timestamp).is.ofType('number');
            });
            test('receives domain events for specific flows.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/',
                    data: { flowNames: ['sampleFlow'], domainEvent: domainEventExecuted }
                });
                assertthat_1.assert.that(receivedDomainEvents.length).is.equalTo(1);
                assertthat_1.assert.that(receivedDomainEvents[0]).is.atLeast({
                    aggregateIdentifier: domainEventExecuted.aggregateIdentifier,
                    name: domainEventExecuted.name,
                    data: domainEventExecuted.data,
                    metadata: {
                        causationId: domainEventExecuted.metadata.causationId,
                        correlationId: domainEventExecuted.metadata.correlationId,
                        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                    }
                });
                assertthat_1.assert.that(receivedDomainEvents[0].id).is.ofType('string');
                assertthat_1.assert.that(receivedDomainEvents[0].metadata.timestamp).is.ofType('number');
            });
            test('returns a 200.', async () => {
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { domainEvent: domainEventExecuted }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
            });
            test('returns 500 if on received domain event throws an error.', async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveDomainEvent() {
                        throw new Error('Failed to handle received domain event.');
                    },
                    application
                }));
                const domainEventExecuted = new DomainEvent_1.DomainEvent({
                    ...buildDomainEvent_1.buildDomainEvent({
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'executed',
                        data: { strategy: 'succeed' },
                        id: uuid_1.v4(),
                        metadata: {
                            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                            revision: 1
                        }
                    })
                });
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/',
                    data: { domainEvent: domainEventExecuted },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(500);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.UnknownError.code,
                    message: 'Unknown error.'
                });
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map