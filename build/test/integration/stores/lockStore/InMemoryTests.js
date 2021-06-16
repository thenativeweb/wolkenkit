"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getTestsFor_1 = require("./getTestsFor");
const InMemory_1 = require("../../../../lib/stores/lockStore/InMemory");
suite('InMemory', () => {
    getTestsFor_1.getTestsFor({
        async createLockStore() {
            return await InMemory_1.InMemoryLockStore.create({ type: 'InMemory' });
        }
    });
});
//# sourceMappingURL=InMemoryTests.js.map