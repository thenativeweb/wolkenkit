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
exports.getOnReceiveCommand = void 0;
const flaschenpost_1 = require("flaschenpost");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getOnReceiveCommand = function ({ priorityQueueStore, newCommandPublisher, newCommandPubSubChannel }) {
    return async function ({ command }) {
        try {
            logger.debug('Enqueueing command in priority queue...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/commandDispatcher', { command }));
            await priorityQueueStore.enqueue({
                item: command,
                discriminator: command.aggregateIdentifier.aggregate.id,
                priority: command.metadata.timestamp
            });
            await newCommandPublisher.publish({
                channel: newCommandPubSubChannel,
                message: {}
            });
            logger.debug('Enqueued command in priority queue.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/commandDispatcher', { command }));
        }
        catch (ex) {
            logger.error('Failed to enqueue command in priority queue.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/commandDispatcher', { command, error: ex }));
            throw new errors.RequestFailed({
                message: 'Failed to enqueue command in priority queue.',
                cause: ex,
                data: { command }
            });
        }
    };
};
exports.getOnReceiveCommand = getOnReceiveCommand;
//# sourceMappingURL=getOnReceiveCommand.js.map