"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getTestsFor_1 = require("./getTestsFor");
const InMemoryPublisher_1 = require("../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher");
const InMemorySubscriber_1 = require("../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber");
suite('InMemory', () => {
    getTestsFor_1.getTestsFor({
        async createPublisher() {
            return await InMemoryPublisher_1.InMemoryPublisher.create({ type: 'InMemory' });
        },
        async createSubscriber() {
            return await InMemorySubscriber_1.InMemorySubscriber.create({ type: 'InMemory' });
        }
    });
});
//# sourceMappingURL=InMemoryTests.js.map