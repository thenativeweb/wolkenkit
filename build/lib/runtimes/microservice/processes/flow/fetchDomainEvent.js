"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDomainEvent = void 0;
const retry_ignore_abort_1 = require("retry-ignore-abort");
const fetchDomainEvent = async function ({ domainEventDispatcher }) {
    const { item, metadata } = await retry_ignore_abort_1.retry(async () => await domainEventDispatcher.client.awaitItem(), { retries: Number.POSITIVE_INFINITY, minTimeout: 10, maxTimeout: 1000 });
    return { domainEvent: item, metadata };
};
exports.fetchDomainEvent = fetchDomainEvent;
//# sourceMappingURL=fetchDomainEvent.js.map