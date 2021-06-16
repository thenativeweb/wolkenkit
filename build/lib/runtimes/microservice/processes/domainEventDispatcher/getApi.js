"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const http_1 = require("../../../../apis/awaitItem/http");
const get_cors_origin_1 = require("get-cors-origin");
const getDomainEventSchema_1 = require("../../../../common/schemas/getDomainEventSchema");
const http_2 = require("../../../../apis/handleDomainEvent/http");
const validate_value_1 = require("validate-value");
const validateDomainEvent_1 = require("../../../../common/validators/validateDomainEvent");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ configuration, application, priorityQueueStore, newDomainEventSubscriber, newDomainEventPubSubChannel, onReceiveDomainEvent }) {
    const { api: handleDomainEventApi } = await http_2.getApi({
        corsOrigin: get_cors_origin_1.getCorsOrigin(configuration.handleDomainEventCorsOrigin),
        application,
        onReceiveDomainEvent
    });
    const domainEventParser = new validate_value_1.Parser(getDomainEventSchema_1.getDomainEventSchema());
    const { api: awaitDomainEventApi } = await http_1.getApi({
        corsOrigin: get_cors_origin_1.getCorsOrigin(configuration.awaitDomainEventCorsOrigin),
        priorityQueueStore,
        newItemSubscriber: newDomainEventSubscriber,
        newItemSubscriberChannel: newDomainEventPubSubChannel,
        validateOutgoingItem({ item }) {
            domainEventParser.parse(item, { valueName: 'domainEvent' }).unwrapOrThrow();
            validateDomainEvent_1.validateDomainEvent({ application, domainEvent: item });
        }
    });
    const api = express_1.default();
    api.use('/handle-domain-event', handleDomainEventApi);
    api.use('/await-domain-event', awaitDomainEventApi);
    return { api };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map