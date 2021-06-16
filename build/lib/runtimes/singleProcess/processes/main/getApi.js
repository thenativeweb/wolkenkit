"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const get_cors_origin_1 = require("get-cors-origin");
const graphql_1 = require("../../../../apis/graphql");
const http_1 = require("../../../../apis/handleCommand/http");
const http_2 = require("../../../../apis/manageFile/http");
const http_3 = require("../../../../apis/observeDomainEvents/http");
const http_4 = require("../../../../apis/openApi/http");
const http_5 = require("../../../../apis/performReplay/http");
const http_6 = require("../../../../apis/queryView/http");
const http_7 = require("../../../../apis/subscribeNotifications/http");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ configuration, application, identityProviders, onReceiveCommand, onCancelCommand, repository, fileStore, subscriber, channelForNotifications, performReplay }) {
    const api = express_1.default();
    const corsOrigin = get_cors_origin_1.getCorsOrigin(configuration.corsOrigin);
    let initializeGraphQlOnServer, publishDomainEventToGraphqlApi, publishDomainEventToRestApi;
    if (configuration.httpApi) {
        const { api: observeDomainEventsApi, publishDomainEvent, getApiDefinitions: getObserveDomainEventApiDefinitions } = await http_3.getApi({
            corsOrigin,
            application,
            identityProviders,
            repository,
            heartbeatInterval: configuration.heartbeatInterval
        });
        publishDomainEventToRestApi = publishDomainEvent;
        const { api: handleCommandApi, getApiDefinitions: getHandleCommandApiDefinitions } = await http_1.getApi({
            corsOrigin,
            onReceiveCommand,
            onCancelCommand,
            application,
            identityProviders
        });
        const { api: queryViewApi, getApiDefinitions: getQueryViewApiDefinitions } = await http_6.getApi({
            corsOrigin,
            application,
            identityProviders
        });
        const { api: manageFileApi, getApiDefinitions: getManageFileApiDefinitions } = await http_2.getApi({
            application,
            corsOrigin,
            identityProviders,
            fileStore
        });
        const { api: subscribeNotificationsApi } = await http_7.getApi({
            application,
            corsOrigin,
            identityProviders,
            channelForNotifications,
            subscriber,
            heartbeatInterval: configuration.heartbeatInterval
        });
        const { api: performReplayApi } = await http_5.getApi({
            application,
            corsOrigin,
            performReplay
        });
        api.use('/command', handleCommandApi);
        api.use('/domain-events', observeDomainEventsApi);
        api.use('/files', manageFileApi);
        api.use('/notifications', subscribeNotificationsApi);
        api.use('/perform-replay', performReplayApi);
        api.use('/views', queryViewApi);
        if (configuration.enableOpenApiDocumentation) {
            const { api: openApiApi } = await http_4.getApi({
                corsOrigin,
                application,
                title: 'Single process runtime API',
                schemes: ['http'],
                apis: [
                    ...getHandleCommandApiDefinitions('command'),
                    ...getObserveDomainEventApiDefinitions('domain-events'),
                    ...getManageFileApiDefinitions('files'),
                    ...getQueryViewApiDefinitions('views')
                ]
            });
            api.use('/open-api', openApiApi);
        }
    }
    if (configuration.graphqlApi !== false) {
        const { api: graphqlApi, publishDomainEvent, initializeGraphQlOnServer: initializeGraphql } = await graphql_1.getApi({
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
            enableIntegratedClient: configuration.graphqlApi.enableIntegratedClient,
            webSocketEndpoint: '/graphql/v2/'
        });
        initializeGraphQlOnServer = initializeGraphql;
        publishDomainEventToGraphqlApi = publishDomainEvent;
        api.use('/graphql', graphqlApi);
    }
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const publishDomainEvent = ({ domainEvent }) => {
        if (publishDomainEventToGraphqlApi) {
            publishDomainEventToGraphqlApi({ domainEvent });
        }
        if (publishDomainEventToRestApi) {
            publishDomainEventToRestApi({ domainEvent });
        }
    };
    return { api, initializeGraphQlOnServer, publishDomainEvent };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map