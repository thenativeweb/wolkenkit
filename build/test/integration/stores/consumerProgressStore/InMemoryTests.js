"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getTestsFor_1 = require("./getTestsFor");
const InMemory_1 = require("../../../../lib/stores/consumerProgressStore/InMemory");
suite('InMemory', () => {
    getTestsFor_1.getTestsFor({
        async createConsumerProgressStore() {
            return await InMemory_1.InMemoryConsumerProgressStore.create({ type: 'InMemory' });
        }
    });
});
//# sourceMappingURL=InMemoryTests.js.map