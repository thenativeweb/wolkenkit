"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acknowledgeDomainEvent = void 0;
const retry_ignore_abort_1 = require("retry-ignore-abort");
const acknowledgeDomainEvent = async function ({ flowName, token, domainEventDispatcher }) {
    await retry_ignore_abort_1.retry(async () => {
        await domainEventDispatcher.client.acknowledge({
            discriminator: flowName,
            token
        });
    }, { retries: domainEventDispatcher.acknowledgeRetries, maxTimeout: 1000 });
};
exports.acknowledgeDomainEvent = acknowledgeDomainEvent;
//# sourceMappingURL=acknowledgeDomainEvent.js.map