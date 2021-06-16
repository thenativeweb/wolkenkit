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
const retry_ignore_abort_1 = require("retry-ignore-abort");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getOnReceiveCommand = function ({ commandDispatcher }) {
    return async function ({ command }) {
        try {
            await retry_ignore_abort_1.retry(async () => {
                await commandDispatcher.client.postCommand({ command });
            }, { retries: commandDispatcher.retries, maxTimeout: 1000 });
            logger.debug('Command sent to command dispatcher.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/graphql', { command }));
        }
        catch (ex) {
            logger.error('Failed to send command to command dispatcher.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/graphql', { command, error: ex }));
            throw new errors.RequestFailed({
                message: 'Failed to send command to command dispatcher.',
                cause: ex,
                data: { command }
            });
        }
    };
};
exports.getOnReceiveCommand = getOnReceiveCommand;
//# sourceMappingURL=getOnReceiveCommand.js.map