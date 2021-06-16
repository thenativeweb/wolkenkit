"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecializedEventEmitter = void 0;
const events_1 = require("events");
class SpecializedEventEmitter {
    constructor() {
        this.eventEmitter = new events_1.EventEmitter();
    }
    emit(eventData) {
        this.eventEmitter.emit(SpecializedEventEmitter.eventName, eventData);
    }
    on(eventHandler) {
        this.eventEmitter.on(SpecializedEventEmitter.eventName, eventHandler);
    }
    once(eventHandler) {
        this.eventEmitter.once(SpecializedEventEmitter.eventName, eventHandler);
    }
    off(eventHandler) {
        this.eventEmitter.off(SpecializedEventEmitter.eventName, eventHandler);
    }
    removeAllListeners() {
        this.eventEmitter.removeAllListeners(SpecializedEventEmitter.eventName);
    }
    asyncIterator() {
        return events_1.on(this.eventEmitter, SpecializedEventEmitter.eventName);
    }
    [Symbol.asyncIterator]() {
        return events_1.on(this.eventEmitter, SpecializedEventEmitter.eventName);
    }
}
exports.SpecializedEventEmitter = SpecializedEventEmitter;
SpecializedEventEmitter.eventName = 'event';
//# sourceMappingURL=SpecializedEventEmitter.js.map