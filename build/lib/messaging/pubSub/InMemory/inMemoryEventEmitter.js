"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inMemoryEventEmitter = void 0;
const eventemitter2_1 = require("eventemitter2");
const inMemoryEventEmitter = new eventemitter2_1.EventEmitter2({
    wildcard: true
});
exports.inMemoryEventEmitter = inMemoryEventEmitter;
//# sourceMappingURL=inMemoryEventEmitter.js.map