"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const execute_1 = require("./commands/execute");
const executed_1 = require("./domainEvents/executed");
const succeeded_1 = require("./domainEvents/succeeded");
const SampleState_1 = require("./SampleState");
const sampleAggregate = {
    getInitialState: SampleState_1.getInitialState,
    commandHandlers: {
        execute: execute_1.execute
    },
    domainEventHandlers: {
        succeeded: succeeded_1.succeeded,
        executed: executed_1.executed
    }
};
exports.default = sampleAggregate;
//# sourceMappingURL=index.js.map