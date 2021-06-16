"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const http_1 = require("../../../../apis/awaitItem/http");
const getCommandWithMetadataSchema_1 = require("../../../../common/schemas/getCommandWithMetadataSchema");
const get_cors_origin_1 = require("get-cors-origin");
const http_2 = require("../../../../apis/handleCommandWithMetadata/http");
const validate_value_1 = require("validate-value");
const validateCommandWithMetadata_1 = require("../../../../common/validators/validateCommandWithMetadata");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ configuration, application, priorityQueueStore, newCommandSubscriber, newCommandPubSubChannel, onReceiveCommand, onCancelCommand }) {
    const { api: handleCommandApi } = await http_2.getApi({
        corsOrigin: get_cors_origin_1.getCorsOrigin(configuration.handleCommandCorsOrigin),
        onReceiveCommand,
        onCancelCommand,
        application
    });
    const commandWithMetadataParser = new validate_value_1.Parser(getCommandWithMetadataSchema_1.getCommandWithMetadataSchema());
    const { api: awaitCommandWithMetadataApi } = await http_1.getApi({
        corsOrigin: get_cors_origin_1.getCorsOrigin(configuration.awaitCommandCorsOrigin),
        priorityQueueStore,
        newItemSubscriber: newCommandSubscriber,
        newItemSubscriberChannel: newCommandPubSubChannel,
        validateOutgoingItem({ item }) {
            commandWithMetadataParser.parse(item, { valueName: 'command' }).unwrapOrThrow();
            validateCommandWithMetadata_1.validateCommandWithMetadata({ application, command: item });
        }
    });
    const api = express_1.default();
    api.use('/handle-command', handleCommandApi);
    api.use('/await-command', awaitCommandWithMetadataApi);
    return { api };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map