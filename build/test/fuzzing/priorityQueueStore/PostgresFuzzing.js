"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../shared/containers/connectionOptions");
const getLoadTestsFor_1 = require("./getLoadTestsFor");
const lodash_1 = require("lodash");
const Postgres_1 = require("../../../lib/stores/priorityQueueStore/Postgres");
suite('Postgres', () => {
    getLoadTestsFor_1.getLoadTestsFor({
        async createPriorityQueueStore({ suffix, expirationTime }) {
            const tableNames = {
                items: `items_${suffix}`,
                priorityQueue: `priority-queue_${suffix}`
            };
            return await Postgres_1.PostgresPriorityQueueStore.create({
                type: 'Postgres',
                doesIdentifierMatchItem: ({ item, itemIdentifier }) => lodash_1.isEqual(item, itemIdentifier),
                ...connectionOptions_1.connectionOptions.postgres,
                tableNames,
                expirationTime
            });
        },
        queueType: 'Postgres'
    });
});
//# sourceMappingURL=PostgresFuzzing.js.map