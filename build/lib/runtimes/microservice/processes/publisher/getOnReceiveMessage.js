"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnReceiveMessage = void 0;
const flaschenpost_1 = require("flaschenpost");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const logger = flaschenpost_1.flaschenpost.getLogger();
const getOnReceiveMessage = function ({ publisher }) {
    return async function ({ channel, message }) {
        logger.debug('Received message.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/publisher', { channel, message }));
        await publisher.publish({
            channel,
            message
        });
    };
};
exports.getOnReceiveMessage = getOnReceiveMessage;
//# sourceMappingURL=getOnReceiveMessage.js.map