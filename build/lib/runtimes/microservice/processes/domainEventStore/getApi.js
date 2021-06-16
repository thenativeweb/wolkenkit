"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const get_cors_origin_1 = require("get-cors-origin");
const http_1 = require("../../../../apis/queryDomainEventStore/http");
const http_2 = require("../../../../apis/writeDomainEventStore/http");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ configuration, domainEventStore }) {
    const { api: queryDomainEventStoreApi } = await http_1.getApi({
        corsOrigin: get_cors_origin_1.getCorsOrigin(configuration.queryDomainEventsCorsOrigin),
        domainEventStore
    });
    const { api: writeDomainEventStoreApi } = await http_2.getApi({
        corsOrigin: get_cors_origin_1.getCorsOrigin(configuration.writeDomainEventsCorsOrigin),
        domainEventStore
    });
    const api = express_1.default();
    api.use('/query', queryDomainEventStoreApi);
    api.use('/write', writeDomainEventStoreApi);
    return { api };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map