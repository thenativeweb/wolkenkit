"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keepRenewingLock = void 0;
const flaschenpost_1 = require("flaschenpost");
const getPromiseStatus_1 = require("../../../../common/utils/getPromiseStatus");
const sleep_1 = require("../../../../common/utils/sleep");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const logger = flaschenpost_1.flaschenpost.getLogger();
const keepRenewingLock = async function ({ command, handleCommandPromise, commandDispatcher, token }) {
    logger.debug('Starting renew lock loop...', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { command, metadata: { token } }));
    // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
    while (true) {
        await sleep_1.sleep({ ms: commandDispatcher.renewalInterval });
        if (await getPromiseStatus_1.getPromiseStatus(handleCommandPromise) !== 'pending') {
            logger.debug('Stopped renew lock loop.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { command, metadata: { token } }));
            break;
        }
        await commandDispatcher.client.renewLock({
            discriminator: command.aggregateIdentifier.aggregate.id,
            token
        });
        logger.debug('Renewed lock on command.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { command, metadata: { token } }));
    }
};
exports.keepRenewingLock = keepRenewingLock;
//# sourceMappingURL=keepRenewingLock.js.map