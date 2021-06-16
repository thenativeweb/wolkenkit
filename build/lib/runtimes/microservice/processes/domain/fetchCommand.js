"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCommand = void 0;
const flaschenpost_1 = require("flaschenpost");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const logger = flaschenpost_1.flaschenpost.getLogger();
const fetchCommand = async function ({ commandDispatcher }) {
    logger.debug('Fetching command...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain'));
    try {
        const { item, metadata } = await retry_ignore_abort_1.retry(async () => await commandDispatcher.client.awaitItem(), { retries: Number.POSITIVE_INFINITY, minTimeout: 10, maxTimeout: 1000 });
        logger.debug('Fetched command.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { command: item, metadata }));
        return { command: item, metadata };
    }
    catch (ex) {
        logger.error('Failed to fetch command.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { error: ex }));
        throw ex;
    }
};
exports.fetchCommand = fetchCommand;
//# sourceMappingURL=fetchCommand.js.map