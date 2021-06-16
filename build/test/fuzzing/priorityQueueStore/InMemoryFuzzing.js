"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getLoadTestsFor_1 = require("./getLoadTestsFor");
const InMemory_1 = require("../../../lib/stores/priorityQueueStore/InMemory");
const lodash_1 = require("lodash");
suite('InMemory', () => {
    getLoadTestsFor_1.getLoadTestsFor({
        async createPriorityQueueStore({ expirationTime }) {
            return await InMemory_1.InMemoryPriorityQueueStore.create({
                type: 'InMemory',
                doesIdentifierMatchItem: ({ item, itemIdentifier }) => lodash_1.isEqual(item, itemIdentifier),
                expirationTime
            });
        },
        queueType: 'InMemory'
    });
});
//# sourceMappingURL=InMemoryFuzzing.js.map