"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCommand = void 0;
const CommandWithMetadata_1 = require("../../../../../common/elements/CommandWithMetadata");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const fetchCommand = async function ({ priorityQueue }) {
    const { item, metadata } = await retry_ignore_abort_1.retry(async () => {
        const lock = await priorityQueue.store.lockNext();
        if (lock === undefined) {
            throw new Error('Command queue is empty.');
        }
        return lock;
    }, { retries: Number.POSITIVE_INFINITY, minTimeout: 10, maxTimeout: 500 });
    return { command: new CommandWithMetadata_1.CommandWithMetadata(item), metadata };
};
exports.fetchCommand = fetchCommand;
//# sourceMappingURL=fetchCommand.js.map