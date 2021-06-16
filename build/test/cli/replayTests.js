"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const buildDomainEvent_1 = require("../../lib/common/utils/test/buildDomainEvent");
const connectionOptions_1 = require("../shared/containers/connectionOptions");
const createConsumerProgressStore_1 = require("../../lib/stores/consumerProgressStore/createConsumerProgressStore");
const createDomainEventStore_1 = require("../../lib/stores/domainEventStore/createDomainEventStore");
const http_1 = require("../../lib/apis/performReplay/http");
const getShortId_1 = require("../shared/getShortId");
const isolated_1 = require("isolated");
const loadApplication_1 = require("../../lib/common/application/loadApplication");
const common_tags_1 = require("common-tags");
const path_1 = __importDefault(require("path"));
const runAsServer_1 = require("../shared/http/runAsServer");
const shelljs_1 = __importDefault(require("shelljs"));
const uuid_1 = require("uuid");
const appName = 'test-app';
const rootPath = path_1.default.join(__dirname, '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('replay', function () {
    this.timeout(120000);
    let api, application, applicationDirectory, consumerProgressStore, consumerProgressStoreOptions, domainEventStore, domainEventStoreOptions, requestedReplays, suffix;
    suiteSetup(async () => {
        applicationDirectory = path_1.default.join(await isolated_1.isolated(), appName);
        shelljs_1.default.exec(`node ${cliPath} --verbose init --directory ${applicationDirectory} --template chat --language javascript ${appName}`);
        shelljs_1.default.exec(`npm install --production`, { cwd: applicationDirectory });
        shelljs_1.default.exec(`node ${cliPath} build`, { cwd: applicationDirectory });
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    setup(async () => {
        suffix = getShortId_1.getShortId();
        requestedReplays = [];
        domainEventStoreOptions = {
            type: 'MySql',
            ...connectionOptions_1.connectionOptions.mySql,
            tableNames: {
                domainEvents: `domainevents_${suffix}`,
                snapshots: `snapshots_${suffix}`
            }
        };
        domainEventStore = await createDomainEventStore_1.createDomainEventStore(domainEventStoreOptions);
        await domainEventStore.setup();
        consumerProgressStoreOptions = {
            type: 'MySql',
            ...connectionOptions_1.connectionOptions.mySql,
            tableNames: {
                progress: `progress_${suffix}`
            }
        };
        consumerProgressStore = await createConsumerProgressStore_1.createConsumerProgressStore(consumerProgressStoreOptions);
        await consumerProgressStore.setup();
        ({ api } = await http_1.getApi({
            corsOrigin: '*',
            async performReplay({ flowNames, aggregates }) {
                requestedReplays.push({ flowNames, aggregates });
            },
            application
        }));
    });
    test('performs a replay for all aggregates in all contexts without resetting the flows.', async () => {
        const domainEvents = [
            buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'communication' },
                    aggregate: { name: 'message', id: uuid_1.v4() }
                },
                name: 'sent',
                data: { text: 'hello world' },
                metadata: {
                    revision: 1
                }
            })
        ];
        await domainEventStore.storeDomainEvents({ domainEvents });
        await consumerProgressStore.setProgress({
            consumerId: 'messages',
            aggregateIdentifier: domainEvents[0].aggregateIdentifier,
            revision: 1
        });
        const { socket } = await runAsServer_1.runAsServer({ app: api });
        const replayCommand = common_tags_1.oneLine `
      node ${cliPath} replay
        --replay-configuration '{"flows":["messages"]}'
        --replay-api-protocol http
        --replay-api-base-path '/v2'
        --replay-api-socket ${socket}
        --consumer-progress-store-options '${JSON.stringify(consumerProgressStoreOptions)}'
        --domain-event-store-options '${JSON.stringify(domainEventStoreOptions)}'
      `;
        const code = await new Promise((resolve, reject) => {
            try {
                shelljs_1.default.exec(replayCommand, { cwd: applicationDirectory }, (innerCode) => {
                    resolve(innerCode);
                });
            }
            catch (ex) {
                reject(ex);
            }
        });
        assertthat_1.assert.that(code).is.equalTo(0);
        assertthat_1.assert.that(requestedReplays).is.equalTo([{
                flowNames: ['messages'],
                aggregates: [
                    {
                        aggregateIdentifier: domainEvents[0].aggregateIdentifier,
                        from: 1,
                        to: 1
                    }
                ]
            }]);
        assertthat_1.assert.that(await consumerProgressStore.getProgress({
            consumerId: 'messages',
            aggregateIdentifier: domainEvents[0].aggregateIdentifier
        })).is.equalTo({ revision: 1, isReplaying: { from: 1, to: 1 } });
    });
    test('performs a replay for all specified aggregates from and to the specified revisions.', async () => {
        const sharedId = uuid_1.v4();
        const domainEvents = [
            buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'communication' },
                    aggregate: { name: 'message', id: uuid_1.v4() }
                },
                name: 'sent',
                data: { text: 'hello world' },
                metadata: {
                    revision: 1
                }
            }),
            buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'communication' },
                    aggregate: { name: 'message', id: sharedId }
                },
                name: 'sent',
                data: { text: 'hello world' },
                metadata: {
                    revision: 1
                }
            }),
            buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'communication' },
                    aggregate: { name: 'message', id: sharedId }
                },
                name: 'liked',
                data: { likes: 1 },
                metadata: {
                    revision: 2
                }
            }),
            buildDomainEvent_1.buildDomainEvent({
                aggregateIdentifier: {
                    context: { name: 'communication' },
                    aggregate: { name: 'message', id: sharedId }
                },
                name: 'liked',
                data: { likes: 2 },
                metadata: {
                    revision: 3
                }
            })
        ];
        await domainEventStore.storeDomainEvents({ domainEvents });
        await consumerProgressStore.setProgress({
            consumerId: 'messages',
            aggregateIdentifier: domainEvents[0].aggregateIdentifier,
            revision: 1
        });
        await consumerProgressStore.setProgress({
            consumerId: 'messages',
            aggregateIdentifier: domainEvents[1].aggregateIdentifier,
            revision: 3
        });
        const { socket } = await runAsServer_1.runAsServer({ app: api });
        const replayCommand = common_tags_1.oneLine `
      node ${cliPath} replay
        --replay-configuration '${JSON.stringify({
            flows: ['messages'],
            contexts: [{
                    contextName: 'communication',
                    aggregates: [{
                            aggregateName: 'message',
                            instances: [{
                                    aggregateId: domainEvents[1].aggregateIdentifier.aggregate.id,
                                    from: 2,
                                    to: 3
                                }]
                        }]
                }]
        })}'
        --replay-api-protocol http
        --replay-api-base-path '/v2'
        --replay-api-socket ${socket}
        --consumer-progress-store-options '${JSON.stringify(consumerProgressStoreOptions)}'
        --domain-event-store-options '${JSON.stringify(domainEventStoreOptions)}'
      `;
        const code = await new Promise((resolve, reject) => {
            try {
                shelljs_1.default.exec(replayCommand, { cwd: applicationDirectory }, (innerCode) => {
                    resolve(innerCode);
                });
            }
            catch (ex) {
                reject(ex);
            }
        });
        assertthat_1.assert.that(code).is.equalTo(0);
        assertthat_1.assert.that(requestedReplays).is.equalTo([{
                flowNames: ['messages'],
                aggregates: [
                    {
                        aggregateIdentifier: domainEvents[1].aggregateIdentifier,
                        from: 2,
                        to: 3
                    }
                ]
            }]);
        assertthat_1.assert.that(await consumerProgressStore.getProgress({
            consumerId: 'messages',
            aggregateIdentifier: domainEvents[0].aggregateIdentifier
        })).is.equalTo({ revision: 1, isReplaying: false });
        assertthat_1.assert.that(await consumerProgressStore.getProgress({
            consumerId: 'messages',
            aggregateIdentifier: domainEvents[1].aggregateIdentifier
        })).is.equalTo({ revision: 3, isReplaying: { from: 2, to: 3 } });
    });
    suite('--dangerously-reevaluate', () => {
        test('performs a replay and resets the flows.', async () => {
            const domainEvents = [
                buildDomainEvent_1.buildDomainEvent({
                    aggregateIdentifier: {
                        context: { name: 'communication' },
                        aggregate: { name: 'message', id: uuid_1.v4() }
                    },
                    name: 'sent',
                    data: { text: 'hello world' },
                    metadata: {
                        revision: 1
                    }
                })
            ];
            await domainEventStore.storeDomainEvents({ domainEvents });
            await consumerProgressStore.setProgress({
                consumerId: 'messages',
                aggregateIdentifier: domainEvents[0].aggregateIdentifier,
                revision: 1
            });
            const { socket } = await runAsServer_1.runAsServer({ app: api });
            const replayCommand = common_tags_1.oneLine `
      node ${cliPath} replay
        --replay-configuration '{"flows":["messages"]}'
        --replay-api-protocol http
        --replay-api-base-path '/v2'
        --replay-api-socket ${socket}
        --consumer-progress-store-options '${JSON.stringify(consumerProgressStoreOptions)}'
        --domain-event-store-options '${JSON.stringify(domainEventStoreOptions)}'
        --dangerously-reevaluate
      `;
            const code = await new Promise((resolve, reject) => {
                try {
                    shelljs_1.default.exec(replayCommand, { cwd: applicationDirectory }, (innerCode) => {
                        resolve(innerCode);
                    });
                }
                catch (ex) {
                    reject(ex);
                }
            });
            assertthat_1.assert.that(code).is.equalTo(0);
            assertthat_1.assert.that(requestedReplays).is.equalTo([{
                    flowNames: ['messages'],
                    aggregates: [
                        {
                            aggregateIdentifier: domainEvents[0].aggregateIdentifier,
                            from: 1,
                            to: 1
                        }
                    ]
                }]);
            assertthat_1.assert.that(await consumerProgressStore.getProgress({
                consumerId: 'messages',
                aggregateIdentifier: domainEvents[0].aggregateIdentifier
            })).is.equalTo({ revision: 0, isReplaying: { from: 1, to: 1 } });
        });
    });
});
//# sourceMappingURL=replayTests.js.map