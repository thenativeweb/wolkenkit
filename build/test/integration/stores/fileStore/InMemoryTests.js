"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getTestsFor_1 = require("./getTestsFor");
const InMemory_1 = require("../../../../lib/stores/fileStore/InMemory");
suite('InMemory', () => {
    getTestsFor_1.getTestsFor({
        async createFileStore() {
            return await InMemory_1.InMemoryFileStore.create({ type: 'InMemory' });
        }
    });
});
//# sourceMappingURL=InMemoryTests.js.map