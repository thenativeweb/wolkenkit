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
const Client_1 = require("../../../../lib/apis/handleDomainEvent/http/v2/Client");
const DomainEvent_1 = require("../../../../lib/common/elements/DomainEvent");
const http_1 = require("../../../../lib/apis/handleDomainEvent/http");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('handleDomainEvent/http/Client', () => {
    let application;
    suite('/v2', () => {
        suiteSetup(async () => {
            const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
            application = await loadApplication_1.loadApplication({ applicationDirectory });
        });
        suite('postDomainEvent', () => {
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
            test('throws an error if a domain event is sent with a non-existent context name.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postDomainEvent({ domainEvent: domainEventExecuted });
                }).is.throwingAsync((ex) => ex.code === errors.ContextNotFound.code &&
                    ex.message === `Context 'nonExistent' not found.`);
            });
            test('throws an error if a domain event is sent with a non-existent aggregate name.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postDomainEvent({ domainEvent: domainEventExecuted });
                }).is.throwingAsync((ex) => ex.code === errors.AggregateNotFound.code &&
                    ex.message === `Aggregate 'sampleContext.nonExistent' not found.`);
            });
            test('throws an error if a domain event is sent with a non-existent domain event name.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postDomainEvent({ domainEvent: domainEventExecuted });
                }).is.throwingAsync((ex) => ex.code === errors.DomainEventNotFound.code &&
                    ex.message === `Domain event 'sampleContext.sampleAggregate.nonExistent' not found.`);
            });
            test('throws an error if a domain event is sent with a payload that does not match the schema.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postDomainEvent({ domainEvent: domainEventExecuted });
                }).is.throwingAsync((ex) => ex.code === errors.DomainEventMalformed.code &&
                    ex.message === 'No enum match (invalidValue), expects: succeed, fail, reject (at domainEvent.data.strategy).');
            });
            test('throws an error if a non-existent flow name is sent.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postDomainEvent({ flowNames: ['nonExistent'], domainEvent: domainEventExecuted });
                }).is.throwingAsync((ex) => ex.code === errors.FlowNotFound.code &&
                    ex.message === `Flow 'nonExistent' not found.`);
            });
            test('sends domain events.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.postDomainEvent({ domainEvent: domainEventExecuted });
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
            test('throws an error if on received domain event throws an error.', async () => {
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
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postDomainEvent({ domainEvent: domainEventExecuted });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code &&
                    ex.message === 'Unknown error.');
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map