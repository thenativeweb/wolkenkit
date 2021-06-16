#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configurationDefinition_1 = require("./configurationDefinition");
const createPriorityQueueStore_1 = require("../../../../stores/priorityQueueStore/createPriorityQueueStore");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../messaging/pubSub/createSubscriber");
const doesItemIdentifierWithClientMatchDomainEvent_1 = require("../../../../common/domain/doesItemIdentifierWithClientMatchDomainEvent");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getApi_1 = require("./getApi");
const getOnReceiveDomainEvent_1 = require("./getOnReceiveDomainEvent");
const http_1 = __importDefault(require("http"));
const loadApplication_1 = require("../../../../common/application/loadApplication");
const registerExceptionHandler_1 = require("../../../../common/utils/process/registerExceptionHandler");
const runHealthServer_1 = require("../../../shared/runHealthServer");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
/* eslint-disable @typescript-eslint/no-floating-promises */
(async () => {
    const logger = flaschenpost_1.flaschenpost.getLogger();
    try {
        registerExceptionHandler_1.registerExceptionHandler();
        const configuration = await fromEnvironmentVariables_1.fromEnvironmentVariables({ configurationDefinition: configurationDefinition_1.configurationDefinition });
        logger.info('Starting domain event dispatcher server...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEventDispatcher'));
        const application = await loadApplication_1.loadApplication({
            applicationDirectory: configuration.applicationDirectory
        });
        const priorityQueueStore = await createPriorityQueueStore_1.createPriorityQueueStore({
            ...configuration.priorityQueueStoreOptions,
            doesIdentifierMatchItem: doesItemIdentifierWithClientMatchDomainEvent_1.doesItemIdentifierWithClientMatchDomainEvent
        });
        const internalNewDomainEventSubscriber = await createSubscriber_1.createSubscriber(configuration.pubSubOptions.subscriber);
        const internalNewDomainEventPublisher = await createPublisher_1.createPublisher(configuration.pubSubOptions.publisher);
        // Publish "new domain event" events on an interval even if there are no new
        // domain events so that missed events or crashing workers will not lead to
        // unprocessed domain events.
        setInterval(async () => {
            await internalNewDomainEventPublisher.publish({
                channel: configuration.pubSubOptions.channelForNewInternalDomainEvents,
                message: {}
            });
            logger.debug('Sent "new internal domain event" event on interval.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEventDispatcher'));
        }, configuration.missedDomainEventRecoveryInterval);
        const { api } = await getApi_1.getApi({
            configuration,
            application,
            priorityQueueStore: priorityQueueStore,
            newDomainEventSubscriber: internalNewDomainEventSubscriber,
            newDomainEventPubSubChannel: configuration.pubSubOptions.channelForNewInternalDomainEvents,
            onReceiveDomainEvent: getOnReceiveDomainEvent_1.getOnReceiveDomainEvent({
                application,
                newDomainEventPublisher: internalNewDomainEventPublisher,
                newDomainEventPubSubChannel: configuration.pubSubOptions.channelForNewInternalDomainEvents,
                priorityQueueStore
            })
        });
        await runHealthServer_1.runHealthServer({
            corsOrigin: configuration.healthCorsOrigin,
            portOrSocket: configuration.healthPortOrSocket
        });
        const server = http_1.default.createServer(api);
        server.listen(configuration.portOrSocket, () => {
            logger.info('Started domain event dispatcher server.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEventDispatcher', { portOrSocket: configuration.portOrSocket, healthPortOrSocket: configuration.healthPortOrSocket }));
        });
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEventDispatcher', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map