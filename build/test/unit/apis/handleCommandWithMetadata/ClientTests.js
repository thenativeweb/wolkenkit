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
const Client_1 = require("../../../../lib/apis/handleCommandWithMetadata/http/v2/Client");
const CommandWithMetadata_1 = require("../../../../lib/common/elements/CommandWithMetadata");
const http_1 = require("../../../../lib/apis/handleCommandWithMetadata/http");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('handleCommandWithMetadata/http/Client', () => {
    let application;
    suite('/v2', () => {
        suiteSetup(async () => {
            const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
            application = await loadApplication_1.loadApplication({ applicationDirectory });
        });
        suite('postCommand', () => {
            let api, receivedCommands;
            setup(async () => {
                receivedCommands = [];
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveCommand({ command }) {
                        receivedCommands.push(command);
                    },
                    async onCancelCommand() {
                        // Intentionally left blank.
                    },
                    application
                }));
            });
            test('throws an exception if a command is sent with a non-existent context name.', async () => {
                const command = new CommandWithMetadata_1.CommandWithMetadata({
                    aggregateIdentifier: {
                        context: { name: 'nonExistent' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' },
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        timestamp: Date.now(),
                        client: {
                            ip: '127.0.0.1',
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                            token: '...'
                        },
                        initiator: {
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                        }
                    }
                });
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postCommand({ command });
                }).is.throwingAsync((ex) => ex.code === errors.ContextNotFound.code &&
                    ex.message === `Context 'nonExistent' not found.`);
            });
            test('throws an exception if a command is sent with a non-existent aggregate name.', async () => {
                const command = new CommandWithMetadata_1.CommandWithMetadata({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'nonExistent', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' },
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        timestamp: Date.now(),
                        client: {
                            ip: '127.0.0.1',
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                            token: '...'
                        },
                        initiator: {
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                        }
                    }
                });
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postCommand({ command });
                }).is.throwingAsync((ex) => ex.code === errors.AggregateNotFound.code &&
                    ex.message === `Aggregate 'sampleContext.nonExistent' not found.`);
            });
            test('throws an exception if a command is sent with a non-existent command name.', async () => {
                const command = new CommandWithMetadata_1.CommandWithMetadata({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'nonExistent',
                    data: { strategy: 'succeed' },
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        timestamp: Date.now(),
                        client: {
                            ip: '127.0.0.1',
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                            token: '...'
                        },
                        initiator: {
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                        }
                    }
                });
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postCommand({ command });
                }).is.throwingAsync((ex) => ex.code === errors.CommandNotFound.code &&
                    ex.message === `Command 'sampleContext.sampleAggregate.nonExistent' not found.`);
            });
            test('throws an exception if a command is sent with a payload that does not match the schema.', async () => {
                const command = new CommandWithMetadata_1.CommandWithMetadata({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'invalid-value' },
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        timestamp: Date.now(),
                        client: {
                            ip: '127.0.0.1',
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                            token: '...'
                        },
                        initiator: {
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                        }
                    }
                });
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postCommand({ command });
                }).is.throwingAsync((ex) => ex.code === errors.CommandMalformed.code &&
                    ex.message === 'No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).');
            });
            test('sends commands.', async () => {
                const command = new CommandWithMetadata_1.CommandWithMetadata({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' },
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        timestamp: Date.now(),
                        client: {
                            ip: '127.0.0.1',
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                            token: '...'
                        },
                        initiator: {
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                        }
                    }
                });
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.postCommand({ command });
                assertthat_1.assert.that(receivedCommands.length).is.equalTo(1);
                assertthat_1.assert.that(receivedCommands[0]).is.atLeast({
                    aggregateIdentifier: command.aggregateIdentifier,
                    name: command.name,
                    data: command.data,
                    metadata: {
                        client: {
                            ip: '127.0.0.1',
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                            token: '...'
                        },
                        initiator: {
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                        }
                    }
                });
                assertthat_1.assert.that(receivedCommands[0].id).is.ofType('string');
                assertthat_1.assert.that(receivedCommands[0].metadata.causationId).is.ofType('string');
                assertthat_1.assert.that(receivedCommands[0].metadata.correlationId).is.ofType('string');
                assertthat_1.assert.that(receivedCommands[0].metadata.timestamp).is.ofType('number');
            });
            test('returns the ID of the sent command.', async () => {
                const command = new CommandWithMetadata_1.CommandWithMetadata({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' },
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        timestamp: Date.now(),
                        client: {
                            ip: '127.0.0.1',
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                            token: '...'
                        },
                        initiator: {
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                        }
                    }
                });
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const { id } = await client.postCommand({ command });
                assertthat_1.assert.that(id).is.equalTo(receivedCommands[0].id);
            });
            test('throws an error if on received command throws an error.', async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveCommand() {
                        throw new Error('Failed to handle received command.');
                    },
                    async onCancelCommand() {
                        // Intentionally left blank.
                    },
                    application
                }));
                const command = new CommandWithMetadata_1.CommandWithMetadata({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' },
                    id: uuid_1.v4(),
                    metadata: {
                        causationId: uuid_1.v4(),
                        correlationId: uuid_1.v4(),
                        timestamp: Date.now(),
                        client: {
                            ip: '127.0.0.1',
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                            token: '...'
                        },
                        initiator: {
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                        }
                    }
                });
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.postCommand({ command });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code &&
                    ex.message === 'Unknown error.');
            });
        });
        suite('cancelCommand', () => {
            let api, cancelledCommands;
            setup(async () => {
                cancelledCommands = [];
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveCommand() {
                        // Intentionally left blank.
                    },
                    async onCancelCommand({ commandIdentifierWithClient }) {
                        cancelledCommands.push(commandIdentifierWithClient);
                    },
                    application
                }));
            });
            test('throws an exception if a non-existent context name is given.', async () => {
                const commandIdentifierWithClient = {
                    aggregateIdentifier: {
                        context: { name: 'nonExistent' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    id: uuid_1.v4(),
                    client: {
                        ip: '127.0.0.1',
                        user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                        token: '...'
                    }
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.cancelCommand({ commandIdentifierWithClient });
                }).is.throwingAsync((ex) => ex.code === errors.ContextNotFound.code &&
                    ex.message === `Context 'nonExistent' not found.`);
            });
            test('throws an exception if a non-existent aggregate name is given.', async () => {
                const commandIdentifierWithClient = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'nonExistent', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    id: uuid_1.v4(),
                    client: {
                        ip: '127.0.0.1',
                        user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                        token: '...'
                    }
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.cancelCommand({ commandIdentifierWithClient });
                }).is.throwingAsync((ex) => ex.code === errors.AggregateNotFound.code &&
                    ex.message === `Aggregate 'sampleContext.nonExistent' not found.`);
            });
            test('throws an exception if a non-existent command name is given.', async () => {
                const commandIdentifierWithClient = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'nonExistent',
                    id: uuid_1.v4(),
                    client: {
                        ip: '127.0.0.1',
                        user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                        token: '...'
                    }
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.cancelCommand({ commandIdentifierWithClient });
                }).is.throwingAsync((ex) => ex.code === errors.CommandNotFound.code &&
                    ex.message === `Command 'sampleContext.sampleAggregate.nonExistent' not found.`);
            });
            test('cancels commands.', async () => {
                const commandIdentifierWithClient = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    id: uuid_1.v4(),
                    client: {
                        ip: '127.0.0.1',
                        user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                        token: '...'
                    }
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.cancelCommand({ commandIdentifierWithClient });
                assertthat_1.assert.that(cancelledCommands.length).is.equalTo(1);
                assertthat_1.assert.that(cancelledCommands[0]).is.equalTo(commandIdentifierWithClient);
            });
            test('throws an error if on cancel command throws an error.', async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveCommand() {
                        // Intentionally left blank.
                    },
                    async onCancelCommand() {
                        throw new Error('Failed to cancel command.');
                    },
                    application
                }));
                const commandIdentifierWithClient = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    id: uuid_1.v4(),
                    client: {
                        ip: '127.0.0.1',
                        user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                        token: '...'
                    }
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.cancelCommand({ commandIdentifierWithClient });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code &&
                    ex.message === 'Unknown error.');
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map