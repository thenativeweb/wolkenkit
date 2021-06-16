"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sampleHandler_1 = require("./handlers/sampleHandler");
const sampleFlow = {
    replayPolicy: 'never',
    domainEventHandlers: {
        sampleHandler: sampleHandler_1.sampleHandler
    }
};
exports.default = sampleFlow;
//# sourceMappingURL=index.js.map