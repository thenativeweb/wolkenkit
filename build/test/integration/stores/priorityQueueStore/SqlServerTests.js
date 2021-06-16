"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const lodash_1 = require("lodash");
const SqlServer_1 = require("../../../../lib/stores/priorityQueueStore/SqlServer");
suite('SqlServer', () => {
    getTestsFor_1.getTestsFor({
        async createPriorityQueueStore({ suffix, expirationTime }) {
            const tableNames = {
                items: `items_${suffix}`,
                priorityQueue: `priority-queue_${suffix}`
            };
            return await SqlServer_1.SqlServerPriorityQueueStore.create({
                type: 'SqlServer',
                doesIdentifierMatchItem: ({ item, itemIdentifier }) => lodash_1.isEqual(item, itemIdentifier),
                ...connectionOptions_1.connectionOptions.sqlServer,
                tableNames,
                expirationTime
            });
        }
    });
});
//# sourceMappingURL=SqlServerTests.js.map