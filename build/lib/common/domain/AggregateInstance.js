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
exports.AggregateInstance = void 0;
const getAggregateService_1 = require("../services/getAggregateService");
const getAggregatesService_1 = require("../services/getAggregatesService");
const getClientService_1 = require("../services/getClientService");
const getErrorService_1 = require("../services/getErrorService");
const getLockService_1 = require("../services/getLockService");
const getLoggerService_1 = require("../services/getLoggerService");
const getNotificationService_1 = require("../services/getNotificationService");
const validateCommandWithMetadata_1 = require("../validators/validateCommandWithMetadata");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
class AggregateInstance {
    constructor({ application, aggregateIdentifier, initialState, domainEventStore, lockStore, publisher, pubSubChannelForNotifications, serviceFactories, snapshotStrategy, repository }) {
        var _a, _b, _c, _d, _e, _f;
        this.application = application;
        this.aggregateIdentifier = aggregateIdentifier;
        this.state = initialState;
        this.revision = 0;
        this.unstoredDomainEvents = [];
        this.domainEventStore = domainEventStore;
        this.lockStore = lockStore;
        this.publisher = publisher;
        this.pubSubChannelForNotifications = pubSubChannelForNotifications;
        this.serviceFactories = {
            getAggregateService: (_a = serviceFactories === null || serviceFactories === void 0 ? void 0 : serviceFactories.getAggregateService) !== null && _a !== void 0 ? _a : getAggregateService_1.getAggregateService,
            getAggregatesService: (_b = serviceFactories === null || serviceFactories === void 0 ? void 0 : serviceFactories.getAggregatesService) !== null && _b !== void 0 ? _b : getAggregatesService_1.getAggregatesService,
            getClientService: (_c = serviceFactories === null || serviceFactories === void 0 ? void 0 : serviceFactories.getClientService) !== null && _c !== void 0 ? _c : getClientService_1.getClientService,
            getLockService: (_d = serviceFactories === null || serviceFactories === void 0 ? void 0 : serviceFactories.getLockService) !== null && _d !== void 0 ? _d : getLockService_1.getLockService,
            getLoggerService: (_e = serviceFactories === null || serviceFactories === void 0 ? void 0 : serviceFactories.getLoggerService) !== null && _e !== void 0 ? _e : getLoggerService_1.getLoggerService,
            getNotificationService: (_f = serviceFactories === null || serviceFactories === void 0 ? void 0 : serviceFactories.getNotificationService) !== null && _f !== void 0 ? _f : getNotificationService_1.getNotificationService
        };
        this.snapshotStrategy = snapshotStrategy;
        this.repository = repository;
    }
    static async create({ application, aggregateIdentifier, domainEventStore, lockStore, snapshotStrategy, publisher, pubSubChannelForNotifications, serviceFactories, repository }) {
        if (!(aggregateIdentifier.context.name in application.domain)) {
            throw new errors.ContextNotFound();
        }
        const contextDefinition = application.domain[aggregateIdentifier.context.name];
        if (!(aggregateIdentifier.aggregate.name in contextDefinition)) {
            throw new errors.AggregateNotFound();
        }
        const initialState = contextDefinition[aggregateIdentifier.aggregate.name].getInitialState();
        const aggregateInstance = new AggregateInstance({
            application,
            aggregateIdentifier,
            initialState,
            domainEventStore,
            lockStore,
            publisher,
            pubSubChannelForNotifications,
            serviceFactories,
            snapshotStrategy,
            repository
        });
        const snapshot = await domainEventStore.getSnapshot({
            aggregateIdentifier
        });
        let fromRevision = 1;
        if (snapshot) {
            aggregateInstance.applySnapshot({ snapshot });
            fromRevision = snapshot.revision + 1;
        }
        const domainEventStream = await domainEventStore.getReplayForAggregate({
            aggregateId: aggregateIdentifier.aggregate.id,
            fromRevision
        });
        const replayStartRevision = fromRevision - 1, replayStartTimestamp = Date.now();
        for await (const domainEvent of domainEventStream) {
            aggregateInstance.state = aggregateInstance.applyDomainEvent({
                application,
                domainEvent
            });
            aggregateInstance.revision = domainEvent.metadata.revision;
        }
        const replayDuration = Date.now() - replayStartTimestamp, replayedDomainEvents = aggregateInstance.revision - replayStartRevision;
        if (replayedDomainEvents > 0 &&
            snapshotStrategy({
                latestSnapshot: snapshot,
                replayDuration,
                replayedDomainEvents
            })) {
            await domainEventStore.storeSnapshot({ snapshot: {
                    aggregateIdentifier,
                    revision: aggregateInstance.revision,
                    state: aggregateInstance.state
                } });
        }
        return aggregateInstance;
    }
    async storeCurrentAggregateState() {
        if (this.unstoredDomainEvents.length === 0) {
            return;
        }
        await this.domainEventStore.storeDomainEvents({
            domainEvents: this.unstoredDomainEvents.map((domainEvent) => domainEvent.withoutState())
        });
    }
    async handleCommand({ command }) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const { aggregateIdentifier, application, domainEventStore, lockStore, publisher, pubSubChannelForNotifications, repository, state, unstoredDomainEvents } = this;
        validateCommandWithMetadata_1.validateCommandWithMetadata({ command, application });
        if (command.aggregateIdentifier.context.name !== aggregateIdentifier.context.name) {
            throw new errors.IdentifierMismatch('Context name does not match.');
        }
        if (command.aggregateIdentifier.aggregate.name !== aggregateIdentifier.aggregate.name) {
            throw new errors.IdentifierMismatch('Aggregate name does not match.');
        }
        if (command.aggregateIdentifier.aggregate.id !== aggregateIdentifier.aggregate.id) {
            throw new errors.IdentifierMismatch('Aggregate id does not match.');
        }
        if (await domainEventStore.hasDomainEventsWithCausationId({ causationId: command.id })) {
            return [];
        }
        const isAuthorizedServices = {
            aggregate: getAggregateService_1.getAggregateService({ application, command, aggregateInstance: this }),
            aggregates: getAggregatesService_1.getAggregatesService({ repository }),
            client: getClientService_1.getClientService({ clientMetadata: command.metadata.client }),
            error: getErrorService_1.getErrorService({ errors: ['CommandRejected'] }),
            infrastructure: {
                ask: application.infrastructure.ask
            },
            lock: getLockService_1.getLockService({ lockStore }),
            logger: getLoggerService_1.getLoggerService({
                fileName: `<app>/server/domain/${command.aggregateIdentifier.context.name}/${command.aggregateIdentifier.aggregate.name}/`,
                packageManifest: application.packageManifest
            }),
            notification: getNotificationService_1.getNotificationService({
                application,
                publisher,
                channel: pubSubChannelForNotifications
            })
        };
        const handleServices = {
            ...isAuthorizedServices,
            infrastructure: {
                ask: application.infrastructure.ask,
                tell: application.infrastructure.tell
            }
        };
        const commandHandler = application.domain[command.aggregateIdentifier.context.name][command.aggregateIdentifier.aggregate.name].commandHandlers[command.name];
        let domainEvents;
        try {
            const clonedCommand = lodash_1.cloneDeep(command);
            const isAuthorized = await commandHandler.isAuthorized(state, clonedCommand, isAuthorizedServices);
            if (!isAuthorized) {
                throw new errors.CommandNotAuthorized();
            }
            await commandHandler.handle(state, clonedCommand, handleServices);
            await this.storeCurrentAggregateState();
            domainEvents = unstoredDomainEvents;
        }
        catch (ex) {
            switch (ex.code) {
                case errors.CommandNotAuthorized.code:
                case errors.CommandRejected.code: {
                    handleServices.aggregate.publishDomainEvent(`${command.name}Rejected`, {
                        reason: ex.message
                    });
                    break;
                }
                default: {
                    handleServices.aggregate.publishDomainEvent(`${command.name}Failed`, {
                        reason: ex.message
                    });
                }
            }
            domainEvents = [
                unstoredDomainEvents[unstoredDomainEvents.length - 1]
            ];
        }
        this.unstoredDomainEvents = [];
        for (const domainEvent of domainEvents) {
            this.state = this.applyDomainEvent({
                application,
                domainEvent
            });
            this.revision = domainEvent.metadata.revision;
        }
        return domainEvents;
    }
    isPristine() {
        return this.revision === 0;
    }
    applySnapshot({ snapshot }) {
        if (this.aggregateIdentifier.aggregate.id !== snapshot.aggregateIdentifier.aggregate.id) {
            throw new errors.IdentifierMismatch('Failed to apply snapshot. Aggregate id does not match.');
        }
        this.state = snapshot.state;
        this.revision = snapshot.revision;
    }
    applyDomainEvent({ application, domainEvent }) {
        if (domainEvent.aggregateIdentifier.context.name !== this.aggregateIdentifier.context.name) {
            throw new errors.IdentifierMismatch('Context name does not match.');
        }
        if (domainEvent.aggregateIdentifier.aggregate.name !== this.aggregateIdentifier.aggregate.name) {
            throw new errors.IdentifierMismatch('Aggregate name does not match.');
        }
        if (domainEvent.aggregateIdentifier.aggregate.id !== this.aggregateIdentifier.aggregate.id) {
            throw new errors.IdentifierMismatch('Aggregate id does not match.');
        }
        const domainEventHandler = lodash_1.get(application.domain, [this.aggregateIdentifier.context.name, this.aggregateIdentifier.aggregate.name, 'domainEventHandlers', domainEvent.name]);
        if (!domainEventHandler) {
            throw new errors.DomainEventUnknown(`Failed to apply unknown domain event '${domainEvent.name}' in '${this.aggregateIdentifier.context.name}.${this.aggregateIdentifier.aggregate.name}'.`);
        }
        const services = {
            logger: this.serviceFactories.getLoggerService({
                fileName: `<app>/server/domain/${domainEvent.aggregateIdentifier.context.name}/${domainEvent.aggregateIdentifier.aggregate.name}/`,
                packageManifest: application.packageManifest
            }),
            infrastructure: {
                ask: application.infrastructure.ask,
                tell: application.infrastructure.tell
            }
        };
        const newStatePartial = domainEventHandler.handle(this.state, domainEvent, services);
        const newState = { ...this.state, ...newStatePartial };
        return newState;
    }
}
exports.AggregateInstance = AggregateInstance;
//# sourceMappingURL=AggregateInstance.js.map