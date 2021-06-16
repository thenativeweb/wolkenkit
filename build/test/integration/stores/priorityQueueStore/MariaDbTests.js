"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const lodash_1 = require("lodash");
const MySql_1 = require("../../../../lib/stores/priorityQueueStore/MySql");
suite('MariaDb', () => {
    getTestsFor_1.getTestsFor({
        async createPriorityQueueStore({ suffix, expirationTime }) {
            return await MySql_1.MySqlPriorityQueueStore.create({
                type: 'MariaDb',
                doesIdentifierMatchItem: ({ item, itemIdentifier }) => lodash_1.isEqual(item, itemIdentifier),
                ...connectionOptions_1.connectionOptions.mariaDb,
                tableNames: {
                    items: `items_${suffix}`,
                    priorityQueue: `priority-queue_${suffix}`
                },
                expirationTime
            });
        }
    });
});
//# sourceMappingURL=MariaDbTests.js.map