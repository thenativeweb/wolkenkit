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
const http_1 = require("../../../../lib/apis/handleCommand/http");
const getApplicationDescription_1 = require("../../../../lib/common/application/getApplicationDescription");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const identityProvider_1 = require("../../../shared/identityProvider");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('handleCommand/http', () => {
    const identityProviders = [identityProvider_1.identityProvider];
    let application;
    suite('/v2', () => {
        suiteSetup(async () => {
            const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
            application = await loadApplication_1.loadApplication({ applicationDirectory });
        });
        suite('GET /description', () => {
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
            test('returns 200.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: '/v2/description'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
            });
            test('returns application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { headers } = await client({
                    method: 'get',
                    url: '/v2/description'
                });
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/json; charset=utf-8');
            });
            test('returns the commands description.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/description'
                });
                const { commands: commandsDescription } = getApplicationDescription_1.getApplicationDescription({
                    application
                });
                // Convert and parse as JSON, to get rid of any values that are undefined.
                // This is what the HTTP API does internally, and here we need to simulate
                // this to make things work.
                const expectedCommandsDescription = JSON.parse(JSON.stringify(commandsDescription));
                assertthat_1.assert.that(data).is.equalTo(expectedCommandsDescription);
            });
        });
        suite('POST /:contextName/:aggregateName/:aggregateId/:commandName', () => {
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
            test('returns 415 if the content-type header is not set to application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/${uuid_1.v4()}/execute`,
                    headers: {
                        'content-type': 'text/plain'
                    },
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
            test('returns 400 if the aggregate id is not a uuid.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/nonExistent/sampleAggregate/not-a-uuid/execute`,
                    data: { strategy: 'succeed' },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: 'Value does not satisfy format: uuid (at command.aggregateIdentifier.aggregate.id).'
                });
            });
            test('returns 400 if a non-existent context name is given.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/nonExistent/sampleAggregate/${uuid_1.v4()}/execute`,
                    data: { strategy: 'succeed' },
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
            test('returns 400 if a non-existent aggregate name is given.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/nonExistent/${uuid_1.v4()}/execute`,
                    data: { strategy: 'succeed' },
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
            test('returns 400 if a non-existent command name is given.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/${uuid_1.v4()}/nonExistent`,
                    data: { strategy: 'succeed' },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.CommandNotFound.code,
                    message: `Command 'sampleContext.sampleAggregate.nonExistent' not found.`
                });
            });
            test('returns 400 if a command is sent with a payload that does not match the schema.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/${uuid_1.v4()}/execute`,
                    data: { strategy: 'invalid-value' },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.CommandMalformed.code,
                    message: 'No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).'
                });
            });
            test('returns 200 if a wellformed and existing command is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/${uuid_1.v4()}/execute`,
                    data: { strategy: 'succeed' }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data.id).is.not.undefined();
            });
            test('receives commands.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const id = uuid_1.v4();
                await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/${id}/execute`,
                    data: { strategy: 'succeed' }
                });
                assertthat_1.assert.that(receivedCommands.length).is.equalTo(1);
                assertthat_1.assert.that(receivedCommands[0]).is.atLeast({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id }
                    },
                    name: 'execute',
                    data: { strategy: 'succeed' },
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
            test('returns the ID of the received command.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/${uuid_1.v4()}/execute`,
                    data: { strategy: 'succeed' }
                });
                assertthat_1.assert.that(data).is.atLeast({
                    id: receivedCommands[0].id
                });
            });
            test('returns 500 if on received command throws an error.', async () => {
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
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/${uuid_1.v4()}/execute`,
                    data: { strategy: 'succeed' },
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
        suite('POST /:contextName/:aggregateName/:commandName', () => {
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
            test('returns 415 if the content-type header is not set to application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/execute`,
                    headers: {
                        'content-type': 'text/plain'
                    },
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
            test('returns 400 if a non-existent context name is given.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/nonExistent/sampleAggregate/execute`,
                    data: { strategy: 'succeed' },
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
            test('returns 400 if a non-existent aggregate name is given.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/nonExistent/execute`,
                    data: { strategy: 'succeed' },
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
            test('returns 400 if a non-existent command name is given.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/nonExistent`,
                    data: { strategy: 'succeed' },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.CommandNotFound.code,
                    message: `Command 'sampleContext.sampleAggregate.nonExistent' not found.`
                });
            });
            test('returns 400 if a command is sent with a payload that does not match the schema.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/execute`,
                    data: { strategy: 'invalid-value' },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.CommandMalformed.code,
                    message: 'No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).'
                });
            });
            test('returns 200 if a wellformed and existing command is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/sampleContext/sampleAggregate/execute`,
                    data: { strategy: 'succeed' }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(data.id).is.not.undefined();
                assertthat_1.assert.that(data.aggregateIdentifier).is.not.undefined();
            });
        });
        suite('POST /cancel', () => {
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
            test('returns 415 if the content-type header is not set to application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/cancel`,
                    headers: {
                        'content-type': 'text/plain'
                    },
                    data: {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'execute',
                        id: uuid_1.v4()
                    },
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
            test('returns 400 if the command identifier is malformed.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/cancel`,
                    data: {
                        aggregateIdentifier: { name: 'sampleAggregate', id: uuid_1.v4() },
                        name: 'execute',
                        id: uuid_1.v4()
                    },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: 'Missing required property: context (at requestBody.aggregateIdentifier.context).'
                });
            });
            test('returns 400 if a non-existent context name is given.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/cancel`,
                    data: {
                        aggregateIdentifier: {
                            context: { name: 'nonExistent' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'execute',
                        id: uuid_1.v4()
                    },
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
            test('returns 400 if a non-existent aggregate name is given.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/cancel`,
                    data: {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'nonExistent', id: uuid_1.v4() }
                        },
                        name: 'execute',
                        id: uuid_1.v4()
                    },
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
            test('returns 400 if a non-existent command name is given.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/cancel`,
                    data: {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'nonExistent',
                        id: uuid_1.v4()
                    },
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.CommandNotFound.code,
                    message: `Command 'sampleContext.sampleAggregate.nonExistent' not found.`
                });
            });
            test('returns 200 if a command can be cancelled successfully.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: `/v2/cancel`,
                    data: {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'execute',
                        id: uuid_1.v4()
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
            });
            test(`returns 404 if a command can't be found.`, async () => {
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    async onReceiveCommand() {
                        // Intentionally left blank.
                    },
                    async onCancelCommand() {
                        throw new errors.ItemNotFound();
                    },
                    application,
                    identityProviders
                }));
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: `/v2/cancel`,
                    data: {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'execute',
                        id: uuid_1.v4()
                    },
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(404);
            });
            test('returns 200 and cancels the given command.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const aggregateId = uuid_1.v4(), commandId = uuid_1.v4();
                const { status } = await client({
                    method: 'post',
                    url: `/v2/cancel`,
                    data: {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: aggregateId }
                        },
                        name: 'execute',
                        id: commandId
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(cancelledCommands.length).is.equalTo(1);
                assertthat_1.assert.that(cancelledCommands[0]).is.atLeast({
                    aggregateIdentifier: {
                        context: { name: 'sampleContext' },
                        aggregate: { name: 'sampleAggregate', id: aggregateId }
                    },
                    name: 'execute',
                    id: commandId,
                    client: {
                        user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' } }
                    }
                });
            });
            test('returns 500 if on cancel command throws an error.', async () => {
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
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: `/v2/cancel`,
                    data: {
                        aggregateIdentifier: {
                            context: { name: 'sampleContext' },
                            aggregate: { name: 'sampleAggregate', id: uuid_1.v4() }
                        },
                        name: 'execute',
                        id: uuid_1.v4()
                    },
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