"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDomainEvent = void 0;
const DomainEvent_1 = require("../../../../../common/elements/DomainEvent");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const fetchDomainEvent = async function ({ priorityQueue }) {
    const { item, metadata } = await retry_ignore_abort_1.retry(async () => {
        const lock = await priorityQueue.store.lockNext();
        if (lock === undefined) {
            throw new Error('Command queue is empty.');
        }
        return lock;
    }, { retries: Number.POSITIVE_INFINITY, minTimeout: 10, maxTimeout: 500 });
    return { domainEvent: new DomainEvent_1.DomainEvent(item), metadata };
};
exports.fetchDomainEvent = fetchDomainEvent;
//# sourceMappingURL=fetchDomainEvent.js.map