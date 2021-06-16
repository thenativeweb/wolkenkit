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
exports.awaitItem = void 0;
const flaschenpost_1 = require("flaschenpost");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const writeLine_1 = require("../../../base/writeLine");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const awaitItem = {
    description: 'Sends the next available item.',
    path: '',
    request: {},
    response: {
        statusCodes: [200],
        stream: true,
        body: {
            type: 'object',
            properties: {
                item: {},
                metadata: {
                    type: 'object',
                    properties: {
                        discriminator: { type: 'string', minLength: 1 },
                        token: { type: 'string', format: 'uuid' }
                    },
                    required: ['discriminator', 'token'],
                    additionalProperties: false
                }
            },
            required: ['item', 'metadata'],
            additionalProperties: false
        }
    },
    getHandler({ priorityQueueStore, newItemSubscriber, newItemSubscriberChannel, validateOutgoingItem, heartbeatInterval }) {
        const responseBodyParser = new validate_value_1.Parser(awaitItem.response.body);
        return async function (req, res) {
            try {
                res.startStream({ heartbeatInterval });
                let lockingHasSucceeded = false;
                const onNewItem = async function () {
                    try {
                        const itemLock = await priorityQueueStore.lockNext();
                        if (itemLock) {
                            lockingHasSucceeded = true;
                            logger.debug('Locked priority queue item.', withLogMetadata_1.withLogMetadata('api', 'awaitItem', { nextLock: itemLock }));
                            await validateOutgoingItem({ item: itemLock.item });
                            responseBodyParser.parse(itemLock, { valueName: 'responseBody' }).unwrapOrThrow();
                            writeLine_1.writeLine({ res, data: itemLock });
                            await newItemSubscriber.unsubscribe({
                                channel: newItemSubscriberChannel,
                                callback: onNewItem
                            });
                            res.end();
                        }
                    }
                    catch (ex) {
                        logger.error('An unexpected error occured when locking an item.', withLogMetadata_1.withLogMetadata('api', 'awaitItem', { error: ex }));
                        await newItemSubscriber.unsubscribe({
                            channel: newItemSubscriberChannel,
                            callback: onNewItem
                        });
                        res.end();
                    }
                };
                await onNewItem();
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (!lockingHasSucceeded) {
                    await newItemSubscriber.subscribe({
                        channel: newItemSubscriberChannel,
                        callback: onNewItem
                    });
                }
            }
            catch (ex) {
                const error = defekt_1.isCustomError(ex) ?
                    ex :
                    new errors.UnknownError({ cause: ex });
                switch (error.code) {
                    case errors.ContentTypeMismatch.code: {
                        res.status(415).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    default: {
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'awaitItem', { error }));
                        res.status(500).json({
                            code: error.code,
                            message: error.message
                        });
                    }
                }
            }
        };
    }
};
exports.awaitItem = awaitItem;
//# sourceMappingURL=awaitItem.js.map