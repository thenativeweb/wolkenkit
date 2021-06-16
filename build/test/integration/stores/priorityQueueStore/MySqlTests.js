"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const lodash_1 = require("lodash");
const MySql_1 = require("../../../../lib/stores/priorityQueueStore/MySql");
suite('MySql', () => {
    getTestsFor_1.getTestsFor({
        async createPriorityQueueStore({ suffix, expirationTime }) {
            const tableNames = {
                items: `items_${suffix}`,
                priorityQueue: `priority-queue_${suffix}`
            };
            return await MySql_1.MySqlPriorityQueueStore.create({
                type: 'MySql',
                doesIdentifierMatchItem: ({ item, itemIdentifier }) => lodash_1.isEqual(item, itemIdentifier),
                ...connectionOptions_1.connectionOptions.mySql,
                tableNames,
                expirationTime
            });
        }
    });
});
//# sourceMappingURL=MySqlTests.js.map