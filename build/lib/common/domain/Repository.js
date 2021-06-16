"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const AggregateInstance_1 = require("./AggregateInstance");
class Repository {
    constructor({ application, domainEventStore, lockStore, snapshotStrategy, publisher, pubSubChannelForNotifications, serviceFactories }) {
        this.application = application;
        this.domainEventStore = domainEventStore;
        this.lockStore = lockStore;
        this.snapshotStrategy = snapshotStrategy;
        this.publisher = publisher;
        this.pubSubChannelForNotifications = pubSubChannelForNotifications;
        this.serviceFactories = serviceFactories;
    }
    async getAggregateInstance({ aggregateIdentifier }) {
        return await AggregateInstance_1.AggregateInstance.create({
            application: this.application,
            aggregateIdentifier,
            lockStore: this.lockStore,
            domainEventStore: this.domainEventStore,
            snapshotStrategy: this.snapshotStrategy,
            publisher: this.publisher,
            pubSubChannelForNotifications: this.pubSubChannelForNotifications,
            serviceFactories: this.serviceFactories,
            repository: this
        });
    }
}
exports.Repository = Repository;
//# sourceMappingURL=Repository.js.map