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
exports.getOnCancelCommand = void 0;
const flaschenpost_1 = require("flaschenpost");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getOnCancelCommand = function ({ priorityQueueStore }) {
    return async function ({ commandIdentifierWithClient }) {
        try {
            logger.debug('Removing command from priority queue...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/commandDispatcher', { commandIdentifierWithClient }));
            await priorityQueueStore.remove({
                itemIdentifier: commandIdentifierWithClient,
                discriminator: commandIdentifierWithClient.aggregateIdentifier.aggregate.id
            });
            logger.debug('Removed command from priority queue.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/commandDispatcher', { commandIdentifierWithClient }));
        }
        catch (ex) {
            logger.error('Failed to remove command from priority queue.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/commandDispatcher', { commandIdentifierWithClient, error: ex }));
            throw new errors.RequestFailed({
                message: 'Failed to remove command from priority queue.',
                cause: ex,
                data: { commandIdentifierWithClient }
            });
        }
    };
};
exports.getOnCancelCommand = getOnCancelCommand;
//# sourceMappingURL=getOnCancelCommand.js.map