"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryPublisher = void 0;
const inMemoryEventEmitter_1 = require("./inMemoryEventEmitter");
class InMemoryPublisher {
    constructor({ eventEmitter }) {
        this.eventEmitter = eventEmitter;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async create(options) {
        return new InMemoryPublisher({ eventEmitter: inMemoryEventEmitter_1.inMemoryEventEmitter });
    }
    async publish({ channel, message }) {
        this.eventEmitter.emit(channel, message);
    }
}
exports.InMemoryPublisher = InMemoryPublisher;
//# sourceMappingURL=InMemoryPublisher.js.map