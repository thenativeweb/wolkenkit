"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getTestsFor_1 = require("./getTestsFor");
const InMemory_1 = require("../../../../lib/stores/priorityQueueStore/InMemory");
const lodash_1 = require("lodash");
suite('InMemory', () => {
    getTestsFor_1.getTestsFor({
        async createPriorityQueueStore({ expirationTime }) {
            return await InMemory_1.InMemoryPriorityQueueStore.create({
                type: 'InMemory',
                doesIdentifierMatchItem: ({ item, itemIdentifier }) => lodash_1.isEqual(item, itemIdentifier),
                expirationTime
            });
        }
    });
});
//# sourceMappingURL=InMemoryTests.js.map