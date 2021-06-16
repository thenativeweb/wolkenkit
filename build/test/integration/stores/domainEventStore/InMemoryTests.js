"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getTestsFor_1 = require("./getTestsFor");
const InMemory_1 = require("../../../../lib/stores/domainEventStore/InMemory");
suite('InMemory', () => {
    getTestsFor_1.getTestsFor({
        async createDomainEventStore() {
            return await InMemory_1.InMemoryDomainEventStore.create({ type: 'InMemory' });
        }
    });
});
//# sourceMappingURL=InMemoryTests.js.map