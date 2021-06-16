"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayCommand = void 0;
const buntstift_1 = require("buntstift");
const createConsumerProgressStore_1 = require("../../../stores/consumerProgressStore/createConsumerProgressStore");
const createDomainEventStore_1 = require("../../../stores/domainEventStore/createDomainEventStore");
const getApplicationRoot_1 = require("../../../common/application/getApplicationRoot");
const getConsumerProgressStoreOptionsSchema_1 = require("../../../runtimes/shared/schemas/getConsumerProgressStoreOptionsSchema");
const getDomainEventStoreOptionsSchema_1 = require("../../../runtimes/shared/schemas/getDomainEventStoreOptionsSchema");
const loadApplication_1 = require("../../../common/application/loadApplication");
const validate_value_1 = require("validate-value");
const parseReplayConfiguration_1 = require("./parseReplayConfiguration");
const Client_1 = require("../../../apis/performReplay/http/v2/Client");
const replayCommand = function () {
    return {
        name: 'replay',
        description: 'Replays the domain events for a number of flows and aggregates.',
        optionDefinitions: [
            {
                name: 'replay-api-protocol',
                description: `set the replay API protocol`,
                type: 'string',
                isRequired: false
            },
            {
                name: 'replay-api-host-name',
                description: `set the replay API host name`,
                type: 'string',
                isRequired: false
            },
            {
                name: 'replay-api-port',
                description: `set the replay API port`,
                type: 'number',
                isRequired: false
            },
            {
                name: 'replay-api-socket',
                description: `set the replay API socket`,
                type: 'string',
                isRequired: false
            },
            {
                name: 'replay-api-base-path',
                description: `set the replay API base path`,
                type: 'string',
                isRequired: false
            },
            {
                name: 'domain-event-store-options',
                type: 'string',
                isRequired: true
            },
            {
                name: 'consumer-progress-store-options',
                type: 'string',
                isRequired: true
            },
            {
                name: 'replay-configuration',
                alias: 'c',
                description: 'A map defining the flows and aggregates to replay',
                type: 'string',
                isRequired: true
            },
            {
                name: 'dangerously-reevaluate',
                description: `Reset the given flows' state before replaying. This forces flows to reevaluate all domain events in the replay, even if they have already seen them.`,
                type: 'boolean',
                defaultValue: false,
                isRequired: false
            }
        ],
        async handle({ options: { 'replay-api-protocol': replayApiProtocol, 'replay-api-host-name': replayApiHostName, 'replay-api-port': replayApiPort, 'replay-api-socket': replayApiSocket, 'replay-api-base-path': replayApiBasePath, 'domain-event-store-options': rawDomainEventStoreOptions, 'consumer-progress-store-options': rawConsumerProgressStoreOptions, 'replay-configuration': rawReplayConfiguration, 'dangerously-reevaluate': dangerouslyReevaluate, verbose } }) {
            var _a, _b;
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const domainEventStoreOptions = JSON.parse(rawDomainEventStoreOptions);
            const consumerProgressStoreOptions = JSON.parse(rawConsumerProgressStoreOptions);
            validate_value_1.parse(domainEventStoreOptions, getDomainEventStoreOptionsSchema_1.getDomainEventStoreOptionsSchema()).unwrapOrThrow();
            validate_value_1.parse(consumerProgressStoreOptions, getConsumerProgressStoreOptionsSchema_1.getConsumerProgressStoreOptionsSchema()).unwrapOrThrow();
            const domainEventStore = await createDomainEventStore_1.createDomainEventStore(domainEventStoreOptions);
            const consumerProgressStore = await createConsumerProgressStore_1.createConsumerProgressStore(consumerProgressStoreOptions);
            const replayClient = new Client_1.Client({
                protocol: replayApiProtocol !== null && replayApiProtocol !== void 0 ? replayApiProtocol : 'https',
                hostName: replayApiHostName !== null && replayApiHostName !== void 0 ? replayApiHostName : 'localhost',
                portOrSocket: (_a = replayApiPort !== null && replayApiPort !== void 0 ? replayApiPort : replayApiSocket) !== null && _a !== void 0 ? _a : 3000,
                path: replayApiBasePath !== null && replayApiBasePath !== void 0 ? replayApiBasePath : '/perform-replay/v2'
            });
            try {
                const applicationDirectory = await getApplicationRoot_1.getApplicationRoot({ directory: process.cwd() });
                const application = await loadApplication_1.loadApplication({ applicationDirectory });
                const parsedReplayConfiguration = JSON.parse(rawReplayConfiguration);
                const replayConfiguration = parseReplayConfiguration_1.parseReplayConfiguration({
                    application,
                    replayConfiguration: parsedReplayConfiguration
                }).unwrapOrThrow();
                const aggregateConfigurationsWithOptionalRevisions = [];
                if (!replayConfiguration.contexts) {
                    for await (const aggregateIdentifier of await domainEventStore.getAggregateIdentifiers()) {
                        aggregateConfigurationsWithOptionalRevisions.push({ aggregateIdentifier });
                    }
                }
                else {
                    for (const context of replayConfiguration.contexts) {
                        if (!context.aggregates) {
                            for (const aggregateName of Object.keys(application.domain[context.contextName])) {
                                for await (const aggregateIdentifier of await domainEventStore.getAggregateIdentifiersByName({ contextName: context.contextName, aggregateName })) {
                                    aggregateConfigurationsWithOptionalRevisions.push({ aggregateIdentifier });
                                }
                            }
                        }
                        else {
                            for (const aggregate of context.aggregates) {
                                if (!aggregate.instances) {
                                    for await (const aggregateIdentifier of await domainEventStore.getAggregateIdentifiersByName({ contextName: context.contextName, aggregateName: aggregate.aggregateName })) {
                                        aggregateConfigurationsWithOptionalRevisions.push({ aggregateIdentifier });
                                    }
                                }
                                else {
                                    for (const instance of aggregate.instances) {
                                        const aggregateIdentifier = {
                                            context: { name: context.contextName },
                                            aggregate: { name: aggregate.aggregateName, id: instance.aggregateId }
                                        };
                                        aggregateConfigurationsWithOptionalRevisions.push({
                                            aggregateIdentifier,
                                            from: instance.from,
                                            to: instance.to
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                const aggregateConfigurations = [];
                for (const aggregateConfiguration of aggregateConfigurationsWithOptionalRevisions) {
                    const { aggregateIdentifier, from, to } = aggregateConfiguration;
                    aggregateConfigurations.push({
                        aggregateIdentifier,
                        from: from !== null && from !== void 0 ? from : 1,
                        to: to !== null && to !== void 0 ? to : (await domainEventStore.getLastDomainEvent({ aggregateIdentifier })).metadata.revision
                    });
                }
                const flowNames = (_b = replayConfiguration.flows) !== null && _b !== void 0 ? _b : Object.keys(application.flows);
                for (const flowName of flowNames) {
                    for (const aggregateConfiguration of aggregateConfigurations) {
                        if (dangerouslyReevaluate) {
                            await consumerProgressStore.resetProgressToRevision({
                                consumerId: flowName,
                                aggregateIdentifier: aggregateConfiguration.aggregateIdentifier,
                                revision: aggregateConfiguration.from - 1
                            });
                        }
                        await consumerProgressStore.setIsReplaying({
                            consumerId: flowName,
                            aggregateIdentifier: aggregateConfiguration.aggregateIdentifier,
                            isReplaying: {
                                from: aggregateConfiguration.from,
                                to: aggregateConfiguration.to
                            }
                        });
                    }
                }
                if (aggregateConfigurations.length === 0) {
                    buntstift_1.buntstift.warn('No aggregates found to perform replays for.');
                    return;
                }
                await replayClient.performReplay({
                    flowNames,
                    aggregates: aggregateConfigurations
                });
                await domainEventStore.destroy();
                await consumerProgressStore.destroy();
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to perform the replay.');
                throw ex;
            }
        }
    };
};
exports.replayCommand = replayCommand;
//# sourceMappingURL=replayCommand.js.map