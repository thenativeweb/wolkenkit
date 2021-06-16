"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const MongoDb_1 = require("../../../../lib/stores/domainEventStore/MongoDb");
suite('MongoDb', () => {
    getTestsFor_1.getTestsFor({
        async createDomainEventStore({ suffix }) {
            return await MongoDb_1.MongoDbDomainEventStore.create({
                type: 'MongoDb',
                ...connectionOptions_1.connectionOptions.mongoDb,
                collectionNames: {
                    domainEvents: `domain-events_${suffix}`,
                    snapshots: `snapshots_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=MongoDbTests.js.map