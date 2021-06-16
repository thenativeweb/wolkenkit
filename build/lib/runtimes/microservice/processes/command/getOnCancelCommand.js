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
const getOnCancelCommand = function ({ commandDispatcher }) {
    return async function ({ commandIdentifierWithClient }) {
        try {
            logger.debug('Cancelling command in command dispatcher...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/command', { commandIdentifierWithClient }));
            await commandDispatcher.client.cancelCommand({ commandIdentifierWithClient });
            logger.debug('Cancelled command in command dispatcher.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/command', { commandIdentifierWithClient }));
        }
        catch (ex) {
            logger.error('Failed to cancel command in command dispatcher.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/command', { commandIdentifierWithClient, error: ex }));
            throw new errors.RequestFailed({
                message: 'Failed to cancel command in command dispatcher.',
                cause: ex,
                data: { commandIdentifierWithClient }
            });
        }
    };
};
exports.getOnCancelCommand = getOnCancelCommand;
//# sourceMappingURL=getOnCancelCommand.js.map