"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../shared/containers/connectionOptions");
const getLoadTestsFor_1 = require("./getLoadTestsFor");
const lodash_1 = require("lodash");
const MongoDb_1 = require("../../../lib/stores/priorityQueueStore/MongoDb");
suite('MongoDb', () => {
    getLoadTestsFor_1.getLoadTestsFor({
        async createPriorityQueueStore({ suffix, expirationTime }) {
            const collectionNames = {
                queues: `queues_${suffix}`
            };
            return await MongoDb_1.MongoDbPriorityQueueStore.create({
                type: 'MongoDb',
                doesIdentifierMatchItem: ({ item, itemIdentifier }) => lodash_1.isEqual(item, itemIdentifier),
                ...connectionOptions_1.connectionOptions.mongoDb,
                collectionNames,
                expirationTime
            });
        },
        queueType: 'MongoDb'
    });
});
//# sourceMappingURL=MongoDbFuzzing.js.map