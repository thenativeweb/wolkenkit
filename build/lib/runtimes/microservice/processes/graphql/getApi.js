"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const get_cors_origin_1 = require("get-cors-origin");
const graphql_1 = require("../../../../apis/graphql");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ configuration, application, identityProviders, onReceiveCommand, onCancelCommand, repository, subscriber, channelForNotifications }) {
    const api = express_1.default();
    const corsOrigin = get_cors_origin_1.getCorsOrigin(configuration.corsOrigin);
    const { api: handleCommandGraphqlApi, publishDomainEvent: publishDomainEventToGraphqlApi, initializeGraphQlOnServer } = await graphql_1.getApi({
        corsOrigin,
        application,
        identityProviders,
        handleCommand: {
            onReceiveCommand,
            onCancelCommand
        },
        observeDomainEvents: {
            repository
        },
        observeNotifications: {
            subscriber,
            channelForNotifications
        },
        queryView: true,
        enableIntegratedClient: configuration.enableIntegratedClient,
        webSocketEndpoint: '/graphql/v2/'
    });
    api.use('/graphql', handleCommandGraphqlApi);
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const publishDomainEvent = ({ domainEvent }) => {
        if (publishDomainEventToGraphqlApi) {
            publishDomainEventToGraphqlApi({ domainEvent });
        }
    };
    return { api, initializeGraphQlOnServer, publishDomainEvent };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map