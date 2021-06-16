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
const Client_1 = require("../../../../lib/apis/handleCommand/http/v2/Client");
const Command_1 = require("../../../../lib/common/elements/Command");
const http_1 = require("../../../../lib/apis/handleCommand/http");
const getApplicationDescription_1 = require("../../../../lib/common/application/getApplicationDescription");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const identityProvider_1 = require("../../../shared/identityProvider");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('handleCommand/http/Client', () => {
    const identityProviders = [identityProvider_1.identityProvider];
    let application;
    suite('/v2', () => {
        suiteSetup(async () => {
            const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
            application = await loadApplication_1.loadApplication({ applicationDirectory });
        });
        suite('getDescription', () => {
            let api;
            setup(async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveCommand() {
                        // Intentionally left blank.
                    },
                    async onCancelCommand() {
                        // Intentionally left blank.
                    },
                    application,
                    identityProviders
                }));
            });
            test('returns the commands description.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const description = await client.getDescription();
                const { commands: commandsDescription } = getApplicationDescription_1.getApplicationDescription({
                    application
                });
                // Convert and parse as JSON, to get rid of any values that are undefined.
                // This is what the HTTP API does internally, and here we need to simulate
                // this to make things work.
                const expectedCommandsDescription = JSON.parse(JSON.stringify(commandsDescription));
                assertthat_1.assert.that(description).is.equalTo(expectedCommandsDescription);
            });
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
                    application,
                    identityProviders
                }));
            });
            test('throws an exception if a command is sent with a non-existent context name.', async () => {
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'nonExistent' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' }
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
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'nonExistent', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' }
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
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'nonExistent',
                    data: { strategy: 'succeed' }
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
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'invalid-value' }
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
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' }
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
                            user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' } }
                        },
                        initiator: {
                            user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' } }
                        }
                    }
                });
                assertthat_1.assert.that(receivedCommands[0].id).is.ofType('string');
                assertthat_1.assert.that(receivedCommands[0].metadata.causationId).is.equalTo(receivedCommands[0].id);
                assertthat_1.assert.that(receivedCommands[0].metadata.correlationId).is.equalTo(receivedCommands[0].id);
                assertthat_1.assert.that(receivedCommands[0].metadata.timestamp).is.ofType('number');
                assertthat_1.assert.that(receivedCommands[0].metadata.client.token).is.ofType('string');
                assertthat_1.assert.that(receivedCommands[0].metadata.client.ip).is.ofType('string');
            });
            test('sends commands without aggregate id.', async () => {
                const command = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate' }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' }
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.postCommand({ command });
                assertthat_1.assert.that(receivedCommands.length).is.equalTo(1);
                assertthat_1.assert.that(receivedCommands[0]).is.atLeast({
                    aggregateIdentifier: {
                        aggregate: {
                            name: command.aggregateIdentifier.aggregate.name
                        }
                    },
                    name: command.name,
                    data: command.data,
                    metadata: {
                        client: {
                            user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' } }
                        },
                        initiator: {
                            user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' } }
                        }
                    }
                });
                assertthat_1.assert.that(receivedCommands[0].aggregateIdentifier.aggregate.id).is.ofType('string');
                assertthat_1.assert.that(receivedCommands[0].id).is.ofType('string');
                assertthat_1.assert.that(receivedCommands[0].metadata.causationId).is.equalTo(receivedCommands[0].id);
                assertthat_1.assert.that(receivedCommands[0].metadata.correlationId).is.equalTo(receivedCommands[0].id);
                assertthat_1.assert.that(receivedCommands[0].metadata.timestamp).is.ofType('number');
                assertthat_1.assert.that(receivedCommands[0].metadata.client.token).is.ofType('string');
                assertthat_1.assert.that(receivedCommands[0].metadata.client.ip).is.ofType('string');
            });
            test('returns the ID and the aggregate ID of the sent command.', async () => {
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' }
                });
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                const { id, aggregateIdentifier } = await client.postCommand({ command });
                assertthat_1.assert.that(id).is.equalTo(receivedCommands[0].id);
                assertthat_1.assert.that(aggregateIdentifier).is.equalTo({ id: command.aggregateIdentifier.aggregate.id });
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
                    application,
                    identityProviders
                }));
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' }
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
                    application,
                    identityProviders
                }));
            });
            test('throws an exception if a non-existent context name is given.', async () => {
                const commandIdentifier = {
                    aggregateIdentifier: {
                        context: { name: 'nonExistent' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    id: uuid_1.v4()
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.cancelCommand({ commandIdentifier });
                }).is.throwingAsync((ex) => ex.code === errors.ContextNotFound.code);
            });
            test('throws an exception if a non-existent aggregate name is given.', async () => {
                const commandIdentifier = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'nonExistent', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    id: uuid_1.v4()
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.cancelCommand({ commandIdentifier });
                }).is.throwingAsync((ex) => ex.code === errors.AggregateNotFound.code);
            });
            test('throws an exception if a non-existent command name is given.', async () => {
                const commandIdentifier = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'nonExistent',
                    id: uuid_1.v4()
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.cancelCommand({ commandIdentifier });
                }).is.throwingAsync((ex) => ex.code === errors.CommandNotFound.code);
            });
            test('cancels commands.', async () => {
                const commandIdentifier = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    id: uuid_1.v4()
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.cancelCommand({ commandIdentifier });
                assertthat_1.assert.that(cancelledCommands.length).is.equalTo(1);
                assertthat_1.assert.that(cancelledCommands[0]).is.atLeast({
                    aggregateIdentifier: commandIdentifier.aggregateIdentifier,
                    name: commandIdentifier.name,
                    id: commandIdentifier.id,
                    client: {
                        user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' } }
                    }
                });
            });
            test('throws an error if on received command throws an error.', async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveCommand() {
                        // Intentionally left blank.
                    },
                    async onCancelCommand() {
                        throw new Error('Failed to cancel command.');
                    },
                    application,
                    identityProviders
                }));
                const commandIdentifier = {
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                    },
                    name: 'execute',
                    id: uuid_1.v4()
                };
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.cancelCommand({ commandIdentifier });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code &&
                    ex.message === 'Unknown error.');
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map