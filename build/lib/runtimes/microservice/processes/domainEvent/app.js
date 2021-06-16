#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Aeonstore_1 = require("../../../../stores/domainEventStore/Aeonstore");
const configurationDefinition_1 = require("./configurationDefinition");
const createLockStore_1 = require("../../../../stores/lockStore/createLockStore");
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../messaging/pubSub/createSubscriber");
const DomainEventWithState_1 = require("../../../../common/elements/DomainEventWithState");
const flaschenpost_1 = require("flaschenpost");
const fromEnvironmentVariables_1 = require("../../../shared/fromEnvironmentVariables");
const getApi_1 = require("./getApi");
const getDomainEventWithStateSchema_1 = require("../../../../common/schemas/getDomainEventWithStateSchema");
const getIdentityProviders_1 = require("../../../shared/getIdentityProviders");
const getSnapshotStrategy_1 = require("../../../../common/domain/getSnapshotStrategy");
const http_1 = __importDefault(require("http"));
const loadApplication_1 = require("../../../../common/application/loadApplication");
const validate_value_1 = require("validate-value");
const registerExceptionHandler_1 = require("../../../../common/utils/process/registerExceptionHandler");
const Repository_1 = require("../../../../common/domain/Repository");
const runHealthServer_1 = require("../../../shared/runHealthServer");
const validateDomainEventWithState_1 = require("../../../../common/validators/validateDomainEventWithState");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
/* eslint-disable @typescript-eslint/no-floating-promises */
(async () => {
    const logger = flaschenpost_1.flaschenpost.getLogger();
    try {
        registerExceptionHandler_1.registerExceptionHandler();
        const configuration = await fromEnvironmentVariables_1.fromEnvironmentVariables({ configurationDefinition: configurationDefinition_1.configurationDefinition });
        logger.info('Starting domain event server...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEvent'));
        const identityProviders = await getIdentityProviders_1.getIdentityProviders({
            identityProvidersEnvironmentVariable: configuration.identityProviders
        });
        const application = await loadApplication_1.loadApplication({
            applicationDirectory: configuration.applicationDirectory
        });
        const domainEventStore = await Aeonstore_1.AeonstoreDomainEventStore.create({
            protocol: configuration.aeonstoreProtocol,
            hostName: configuration.aeonstoreHostName,
            portOrSocket: configuration.aeonstorePortOrSocket
        });
        const publisher = await createPublisher_1.createPublisher(configuration.pubSubOptions.publisher);
        const subscriber = await createSubscriber_1.createSubscriber(configuration.pubSubOptions.subscriber);
        const repository = new Repository_1.Repository({
            application,
            lockStore: await createLockStore_1.createLockStore({ type: 'InMemory' }),
            domainEventStore,
            snapshotStrategy: getSnapshotStrategy_1.getSnapshotStrategy(configuration.snapshotStrategy),
            publisher,
            pubSubChannelForNotifications: configuration.pubSubOptions.channelForNotifications
        });
        const { api, publishDomainEvent } = await getApi_1.getApi({
            configuration,
            application,
            identityProviders,
            repository
        });
        const server = http_1.default.createServer(api);
        await runHealthServer_1.runHealthServer({
            corsOrigin: configuration.healthCorsOrigin,
            portOrSocket: configuration.healthPortOrSocket
        });
        await new Promise((resolve) => {
            server.listen(configuration.portOrSocket, () => {
                resolve();
            });
        });
        logger.info('Started domain event server.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEvent', { portOrSocket: configuration.portOrSocket, healthPortOrSocket: configuration.healthPortOrSocket }));
        const domainEventWithStateParser = new validate_value_1.Parser(getDomainEventWithStateSchema_1.getDomainEventWithStateSchema());
        await subscriber.subscribe({
            channel: configuration.pubSubOptions.channelForNewDomainEvents,
            callback(rawDomainEvent) {
                const domainEvent = new DomainEventWithState_1.DomainEventWithState(rawDomainEvent);
                logger.debug('Received domain event from subscriber.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEvent', { domainEvent }));
                try {
                    domainEventWithStateParser.parse(domainEvent, { valueName: 'domainEvent' }).unwrapOrThrow();
                    validateDomainEventWithState_1.validateDomainEventWithState({ domainEvent, application });
                }
                catch (ex) {
                    logger.error('Received a message with an unexpected format from the publisher.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEvent', { domainEvent, error: ex }));
                    return;
                }
                logger.debug('Publishing domain event via API...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEvent', { domainEvent }));
                publishDomainEvent({ domainEvent });
                logger.debug('Published domain event via API.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEvent', { domainEvent }));
            }
        });
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domainEvent', { error: ex }));
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=app.js.map