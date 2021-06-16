"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acknowledgeCommand = void 0;
const flaschenpost_1 = require("flaschenpost");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const logger = flaschenpost_1.flaschenpost.getLogger();
const acknowledgeCommand = async function ({ command, token, commandDispatcher }) {
    logger.debug('Acknowledging command...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { command, metadata: { token } }));
    try {
        await retry_ignore_abort_1.retry(async () => {
            await commandDispatcher.client.acknowledge({
                discriminator: command.aggregateIdentifier.aggregate.id,
                token
            });
        }, { retries: commandDispatcher.acknowledgeRetries, maxTimeout: 1000 });
        logger.debug('Acknowledged command.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { command, metadata: { token } }));
    }
    catch (ex) {
        logger.error('Failed to acknowledge command.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { error: ex }));
        throw ex;
    }
};
exports.acknowledgeCommand = acknowledgeCommand;
//# sourceMappingURL=acknowledgeCommand.js.map