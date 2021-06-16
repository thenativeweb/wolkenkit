"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformReplay = void 0;
const DomainEvent_1 = require("../../../../common/elements/DomainEvent");
const flaschenpost_1 = require("flaschenpost");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getPerformReplay = function ({ domainEventStore, domainEventDispatcherClient }) {
    return async function ({ flowNames, aggregates }) {
        try {
            logger.debug('Performing replay...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/replay', { flowNames, aggregates }));
            for (const aggregate of aggregates) {
                const domainEventStream = await domainEventStore.getReplayForAggregate({
                    aggregateId: aggregate.aggregateIdentifier.aggregate.id,
                    fromRevision: aggregate.from,
                    toRevision: aggregate.to
                });
                for await (const rawDomainEvent of domainEventStream) {
                    const domainEvent = new DomainEvent_1.DomainEvent(rawDomainEvent);
                    await domainEventDispatcherClient.postDomainEvent({ flowNames, domainEvent });
                }
            }
            logger.debug('Replay performed.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/replay', { flowNames, aggregates }));
        }
        catch (ex) {
            logger.error('Failed to perform replay.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/replay', { flowNames, aggregates, error: ex }));
            throw new errors.ReplayFailed({
                message: 'Failed to perform replay.',
                cause: ex,
                data: { flowNames, aggregates }
            });
        }
    };
};
exports.getPerformReplay = getPerformReplay;
//# sourceMappingURL=getPerformReplay.js.map