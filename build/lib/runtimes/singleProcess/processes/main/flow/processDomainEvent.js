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
exports.processDomainEvent = void 0;
const acknowledgeDomainEvent_1 = require("./acknowledgeDomainEvent");
const executeFlow_1 = require("../../../../../common/domain/executeFlow");
const fetchDomainEvent_1 = require("./fetchDomainEvent");
const flaschenpost_1 = require("flaschenpost");
const getAggregatesService_1 = require("../../../../../common/services/getAggregatesService");
const getCommandService_1 = require("../../../../../common/services/getCommandService");
const getDomainEventSchema_1 = require("../../../../../common/schemas/getDomainEventSchema");
const getLockService_1 = require("../../../../../common/services/getLockService");
const getLoggerService_1 = require("../../../../../common/services/getLoggerService");
const getNotificationService_1 = require("../../../../../common/services/getNotificationService");
const keepRenewingLock_1 = require("./keepRenewingLock");
const validate_value_1 = require("validate-value");
const withLogMetadata_1 = require("../../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const domainEventParser = new validate_value_1.Parser(getDomainEventSchema_1.getDomainEventSchema());
const processDomainEvent = async function ({ application, priorityQueue, consumerProgressStore, lockStore, repository, issueCommand, performReplay }) {
    const { domainEvent, metadata } = await fetchDomainEvent_1.fetchDomainEvent({ priorityQueue });
    const flowName = metadata.discriminator;
    logger.debug('Fetched and locked domain event for flow execution.', withLogMetadata_1.withLogMetadata('runtime', 'singleProcess/main', { itemIdentifier: domainEvent.getItemIdentifier(), metadata }));
    try {
        domainEventParser.parse(domainEvent, { valueName: 'domainEvent' }).unwrapOrThrow((err) => new errors.DomainEventMalformed(err.message));
        if (!(flowName in application.flows)) {
            throw new errors.FlowNotFound(`Received a domain event for unknown flow '${flowName}'.`);
        }
        const flowPromise = executeFlow_1.executeFlow({
            application,
            domainEvent,
            flowName,
            flowProgressStore: consumerProgressStore,
            services: {
                aggregates: getAggregatesService_1.getAggregatesService({ repository }),
                command: getCommandService_1.getCommandService({ domainEvent, issueCommand }),
                infrastructure: application.infrastructure,
                logger: getLoggerService_1.getLoggerService({
                    fileName: `<app>/server/flows/${flowName}`,
                    packageManifest: application.packageManifest
                }),
                lock: getLockService_1.getLockService({ lockStore }),
                notification: getNotificationService_1.getNotificationService({
                    application,
                    publisher: repository.publisher,
                    channel: repository.pubSubChannelForNotifications
                })
            },
            performReplay
        });
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        (async () => {
            await keepRenewingLock_1.keepRenewingLock({ flowName, flowPromise, priorityQueue, token: metadata.token });
        })();
        const howToProceed = await flowPromise;
        switch (howToProceed) {
            case 'acknowledge': {
                await acknowledgeDomainEvent_1.acknowledgeDomainEvent({ flowName, token: metadata.token, priorityQueue });
                logger.debug('Acknowledged domain event.', withLogMetadata_1.withLogMetadata('runtime', 'singleProcess/main', { itemIdentifier: domainEvent.getItemIdentifier(), metadata }));
                break;
            }
            case 'defer': {
                await priorityQueue.store.defer({
                    discriminator: flowName,
                    priority: domainEvent.metadata.timestamp,
                    token: metadata.token
                });
                logger.debug('Skipped and deferred domain event.', withLogMetadata_1.withLogMetadata('runtime', 'singleProcess/main', { itemIdentifier: domainEvent.getItemIdentifier(), metadata }));
                break;
            }
            default: {
                throw new errors.InvalidOperation();
            }
        }
    }
    catch (ex) {
        logger.error('Failed to handle domain event.', withLogMetadata_1.withLogMetadata('runtime', 'singleProcess/main', { domainEvent, error: ex }));
        await acknowledgeDomainEvent_1.acknowledgeDomainEvent({ flowName, token: metadata.token, priorityQueue });
    }
};
exports.processDomainEvent = processDomainEvent;
//# sourceMappingURL=processDomainEvent.js.map