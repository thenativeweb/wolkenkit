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
const asJsonStream_1 = require("../../../shared/http/asJsonStream");
const assertthat_1 = require("assertthat");
const buildCommandWithMetadata_1 = require("../../../../lib/common/utils/test/buildCommandWithMetadata");
const CommandWithMetadata_1 = require("../../../../lib/common/elements/CommandWithMetadata");
const createPriorityQueueStore_1 = require("../../../../lib/stores/priorityQueueStore/createPriorityQueueStore");
const doesItemIdentifierWithClientMatchCommandWithMetadata_1 = require("../../../../lib/common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata");
const http_1 = require("../../../../lib/apis/awaitItem/http");
const getCommandWithMetadataSchema_1 = require("../../../../lib/common/schemas/getCommandWithMetadataSchema");
const inMemoryEventEmitter_1 = require("../../../../lib/messaging/pubSub/InMemory/inMemoryEventEmitter");
const InMemoryPublisher_1 = require("../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher");
const InMemorySubscriber_1 = require("../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber");
const validate_value_1 = require("validate-value");
const uuid_1 = require("../../../../lib/common/utils/uuid");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const sleep_1 = require("../../../../lib/common/utils/sleep");
const uuid_2 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
const commandWithMetadataParser = new validate_value_1.Parser(getCommandWithMetadataSchema_1.getCommandWithMetadataSchema());
suite('awaitItem/http', () => {
    suite('/v2', () => {
        const expirationTime = 600;
        const pollInterval = 500;
        let api, newItemPublisher, newItemSubscriber, newItemSubscriberChannel, priorityQueueStore;
        setup(async () => {
            newItemSubscriber = await InMemorySubscriber_1.InMemorySubscriber.create({ type: 'InMemory' });
            newItemSubscriberChannel = uuid_2.v4();
            newItemPublisher = await InMemoryPublisher_1.InMemoryPublisher.create({ type: 'InMemory' });
            priorityQueueStore = await createPriorityQueueStore_1.createPriorityQueueStore({
                type: 'InMemory',
                doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata_1.doesItemIdentifierWithClientMatchCommandWithMetadata,
                expirationTime
            });
            ({ api } = await http_1.getApi({
                corsOrigin: '*',
                priorityQueueStore: priorityQueueStore,
                newItemSubscriber,
                newItemSubscriberChannel,
                validateOutgoingItem({ item }) {
                    commandWithMetadataParser.parse(item).unwrapOrThrow();
                }
            }));
        });
        suite('GET /', () => {
            test('returns 200.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
            });
            test('returns the content-type application/x-ndjson.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { headers } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(headers['content-type']).is.equalTo('application/x-ndjson');
            });
            test('leaves the connection open indefinitely as long as no command is enqueued.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                await new Promise(async (resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        reject(new Error('Stream should not have closed yet.'));
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        }
                    ]));
                    await sleep_1.sleep({ ms: pollInterval });
                    resolve();
                });
            });
            test('closes the connection once a command has been delivered and a notification has been sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.item).is.equalTo(commandWithMetadata);
                            assertthat_1.assert.that(streamElement.metadata.token).is.matching(uuid_1.regex);
                        }
                    ]));
                });
            });
            test('redelivers the same command if the timeout expires.', async function () {
                this.timeout(5000);
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleContext',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                const { data: dataFirstTry } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                await new Promise((resolve) => {
                    dataFirstTry.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.item).is.equalTo(commandWithMetadata);
                            assertthat_1.assert.that(streamElement.metadata.token).is.matching(uuid_1.regex);
                            resolve();
                        }
                    ]));
                });
                await sleep_1.sleep({ ms: 1.25 * expirationTime });
                const { data: dataSecondTry } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    dataSecondTry.on('error', (err) => {
                        reject(err);
                    });
                    dataSecondTry.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.item).is.equalTo(commandWithMetadata);
                            assertthat_1.assert.that(streamElement.metadata.token).is.matching(uuid_1.regex);
                            resolve();
                        }
                    ]));
                });
            });
            test('delivers commands in different aggregates in parallel.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const commandOne = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleContext',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                const commandTwo = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleContext',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandOne,
                    discriminator: commandOne.aggregateIdentifier.aggregate.id,
                    priority: commandOne.metadata.timestamp
                });
                await priorityQueueStore.enqueue({
                    item: commandTwo,
                    discriminator: commandTwo.aggregateIdentifier.aggregate.id,
                    priority: commandTwo.metadata.timestamp
                });
                const { data: dataFirstTry } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                const { data: dataSecondTry } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    dataSecondTry.on('error', (err) => {
                        reject(err);
                    });
                    dataFirstTry.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.item).is.equalTo(commandOne);
                            resolve();
                        }
                    ]));
                });
                await new Promise((resolve, reject) => {
                    dataSecondTry.on('error', (err) => {
                        reject(err);
                    });
                    dataSecondTry.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.item).is.equalTo(commandTwo);
                            resolve();
                        }
                    ]));
                });
            });
            test('closes the stream if a malformatted item is encountered.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                const brokenCommandWithMetadata = { foo: 'bar' };
                await priorityQueueStore.enqueue({
                    item: brokenCommandWithMetadata,
                    discriminator: uuid_2.v4(),
                    priority: Date.now()
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        () => {
                            reject(new Error('Should not have received another item from the server.'));
                        }
                    ]));
                });
            });
            test('if an item was available for locking previous to the client request, after completing the request the subscriber is unsubscribed from the event subscriber.', async () => {
                class SubInMemorySubscriber extends InMemorySubscriber_1.InMemorySubscriber {
                    listenerCount(channel) {
                        return this.eventEmitter.listenerCount(channel);
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    static async create(options) {
                        return new SubInMemorySubscriber({ eventEmitter: inMemoryEventEmitter_1.inMemoryEventEmitter });
                    }
                }
                const newItemSubSubscriber = await SubInMemorySubscriber.create({ type: 'InMemory' });
                newItemSubscriberChannel = uuid_2.v4();
                newItemPublisher = await InMemoryPublisher_1.InMemoryPublisher.create({ type: 'InMemory' });
                priorityQueueStore = await createPriorityQueueStore_1.createPriorityQueueStore({
                    type: 'InMemory',
                    doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata_1.doesItemIdentifierWithClientMatchCommandWithMetadata,
                    expirationTime
                });
                ({ api } = await http_1.getApi({
                    corsOrigin: '*',
                    priorityQueueStore: priorityQueueStore,
                    newItemSubscriber: newItemSubSubscriber,
                    newItemSubscriberChannel,
                    validateOutgoingItem({ item }) {
                        commandWithMetadataParser.parse(item).unwrapOrThrow();
                    }
                }));
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                const { data } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    data.on('error', (err) => {
                        reject(err);
                    });
                    data.on('close', () => {
                        resolve();
                    });
                    data.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.item).is.equalTo(commandWithMetadata);
                            assertthat_1.assert.that(streamElement.metadata.token).is.matching(uuid_1.regex);
                        }
                    ]));
                });
                assertthat_1.assert.that(newItemSubSubscriber.listenerCount(newItemSubscriberChannel)).is.equalTo(0);
            });
        });
        suite('POST /renew-lock', () => {
            test('returns 400 if a too short discriminator is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/renew-lock',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: '',
                        token: uuid_2.v4()
                    },
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).'
                });
            });
            test('returns 403 if an unknown token is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/renew-lock',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                        token: uuid_2.v4()
                    },
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(403);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.TokenMismatch.code,
                    message: `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.aggregate.id}'.`
                });
            });
            test('returns 415 if the content type header is not application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/renew-lock',
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(415);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.ContentTypeMismatch.code,
                    message: 'Header content-type must be application/json.'
                });
            });
            test('returns 200 and extends the lock expiry time.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                const { status, data: lockData } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                const { metadata: { token } } = await new Promise((resolve, reject) => {
                    lockData.on('error', (err) => {
                        reject(err);
                    });
                    lockData.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            resolve(streamElement);
                        }
                    ]));
                });
                await sleep_1.sleep({ ms: 0.6 * expirationTime });
                await client({
                    method: 'post',
                    url: '/v2/renew-lock',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                        token
                    }
                });
                await sleep_1.sleep({ ms: 0.6 * expirationTime });
                // We have now waited 1.2 * expirationTime, so if the request to
                // /renew-lock did not work, the command should be available again.
                // If the request worked, the next request to /v2/ should stay open
                // indefinitely.
                const { data: unavailableLockData } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                await new Promise(async (resolve, reject) => {
                    unavailableLockData.on('error', (err) => {
                        reject(err);
                    });
                    unavailableLockData.on('close', () => {
                        reject(new Error('Stream should not have closed yet.'));
                    });
                    unavailableLockData.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        }
                    ]));
                    await sleep_1.sleep({ ms: pollInterval });
                    resolve();
                });
            });
        });
        suite('POST /acknowledge', () => {
            test('returns 400 if a too short discriminator is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/acknowledge',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: '',
                        token: uuid_2.v4()
                    },
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).'
                });
            });
            test('returns 403 if an unknown token is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/acknowledge',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                        token: uuid_2.v4()
                    },
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(403);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.TokenMismatch.code,
                    message: `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.aggregate.id}'.`
                });
            });
            test('returns 415 if the content type header is not application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/acknowledge',
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(415);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.ContentTypeMismatch.code,
                    message: 'Header content-type must be application/json.'
                });
            });
            test('returns 200 and removes the item from the queue and lets the next item for the same aggregate pass.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const aggregateId = uuid_2.v4();
                const commandOne = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: aggregateId
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                const commandTwo = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: aggregateId
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandOne,
                    discriminator: commandOne.aggregateIdentifier.aggregate.id,
                    priority: commandOne.metadata.timestamp
                });
                await priorityQueueStore.enqueue({
                    item: commandTwo,
                    discriminator: commandTwo.aggregateIdentifier.aggregate.id,
                    priority: commandTwo.metadata.timestamp
                });
                const { status, data: firstLockData } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                const { item, metadata: { token } } = await new Promise((resolve, reject) => {
                    firstLockData.on('error', (err) => {
                        reject(err);
                    });
                    firstLockData.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            resolve(streamElement);
                        }
                    ]));
                });
                const commandWithMetadata = new CommandWithMetadata_1.CommandWithMetadata(item);
                await client({
                    method: 'post',
                    url: '/v2/acknowledge',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                        token
                    }
                });
                const { data: secondLockData } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    secondLockData.on('error', (err) => {
                        reject(err);
                    });
                    secondLockData.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.item).is.equalTo(commandTwo);
                            resolve();
                        }
                    ]));
                });
            });
        });
        suite('POST /defer', () => {
            test('returns 400 if a too short discriminator is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/defer',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: '',
                        token: uuid_2.v4(),
                        priority: Date.now()
                    },
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).'
                });
            });
            test('returns 403 if an unknown token is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandWithMetadata,
                    discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                    priority: commandWithMetadata.metadata.timestamp
                });
                await newItemPublisher.publish({
                    channel: newItemSubscriberChannel,
                    message: {}
                });
                await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/defer',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                        token: uuid_2.v4(),
                        priority: Date.now()
                    },
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(403);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.TokenMismatch.code,
                    message: `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.aggregate.id}'.`
                });
            });
            test('returns 400 if an invalid priority is sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const commandWithMetadata = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: uuid_2.v4()
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/defer',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                        token: uuid_2.v4(),
                        priority: -1
                    },
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(400);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.RequestMalformed.code,
                    message: 'Value -1 is less than minimum 0 (at requestBody.priority).'
                });
            });
            test('returns 415 if the content type header is not application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status, data } = await client({
                    method: 'post',
                    url: '/v2/defer',
                    validateStatus: () => true
                });
                assertthat_1.assert.that(status).is.equalTo(415);
                assertthat_1.assert.that(data).is.equalTo({
                    code: errors.ContentTypeMismatch.code,
                    message: 'Header content-type must be application/json.'
                });
            });
            test('returns 200 and defers the item from the queue and lets the next item for the same aggregate pass.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const aggregateId = uuid_2.v4();
                const commandOne = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: aggregateId
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                const commandTwo = buildCommandWithMetadata_1.buildCommandWithMetadata({
                    aggregateIdentifier: {
                        context: {
                            name: 'sampleContext'
                        },
                        aggregate: {
                            name: 'sampleAggregate',
                            id: aggregateId
                        }
                    },
                    name: 'execute',
                    data: {}
                });
                await priorityQueueStore.enqueue({
                    item: commandOne,
                    discriminator: commandOne.aggregateIdentifier.aggregate.id,
                    priority: commandOne.metadata.timestamp
                });
                await priorityQueueStore.enqueue({
                    item: commandTwo,
                    discriminator: commandTwo.aggregateIdentifier.aggregate.id,
                    priority: commandTwo.metadata.timestamp
                });
                const { data: firstLockData } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                const { item, metadata: { token } } = await new Promise((resolve, reject) => {
                    firstLockData.on('error', (err) => {
                        reject(err);
                    });
                    firstLockData.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            resolve(streamElement);
                        }
                    ]));
                });
                const commandWithMetadata = new CommandWithMetadata_1.CommandWithMetadata(item);
                await client({
                    method: 'post',
                    url: '/v2/defer',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
                        token,
                        priority: Date.now()
                    }
                });
                const { status, data: secondLockData } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                const { item: nextItem, metadata: { token: nextToken } } = await new Promise((resolve, reject) => {
                    secondLockData.on('error', (err) => {
                        reject(err);
                    });
                    secondLockData.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            resolve(streamElement);
                        }
                    ]));
                });
                const nextCommandWithMetadata = new CommandWithMetadata_1.CommandWithMetadata(nextItem);
                await client({
                    method: 'post',
                    url: '/v2/acknowledge',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        discriminator: nextCommandWithMetadata.aggregateIdentifier.aggregate.id,
                        token: nextToken
                    }
                });
                const { data: thirdLockData } = await client({
                    method: 'get',
                    url: '/v2/',
                    responseType: 'stream'
                });
                await new Promise((resolve, reject) => {
                    thirdLockData.on('error', (err) => {
                        reject(err);
                    });
                    thirdLockData.pipe(asJsonStream_1.asJsonStream([
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
                        },
                        (streamElement) => {
                            assertthat_1.assert.that(streamElement.item).is.equalTo(commandOne);
                            resolve();
                        }
                    ]));
                });
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map