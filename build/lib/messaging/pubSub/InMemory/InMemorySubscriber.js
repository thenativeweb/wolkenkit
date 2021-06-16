"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySubscriber = void 0;
const inMemoryEventEmitter_1 = require("./inMemoryEventEmitter");
class InMemorySubscriber {
    constructor({ eventEmitter }) {
        this.eventEmitter = eventEmitter;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async create(options) {
        return new InMemorySubscriber({ eventEmitter: inMemoryEventEmitter_1.inMemoryEventEmitter });
    }
    async subscribe({ channel, callback }) {
        this.eventEmitter.on(channel, callback);
    }
    async unsubscribe({ channel, callback }) {
        this.eventEmitter.off(channel, callback);
    }
}
exports.InMemorySubscriber = InMemorySubscriber;
//# sourceMappingURL=InMemorySubscriber.js.map