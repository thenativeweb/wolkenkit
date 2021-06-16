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
exports.getV2 = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const ClientMetadata_1 = require("../../../common/utils/http/ClientMetadata");
const getApiBase_1 = require("../../base/getApiBase");
const getAuthenticationMiddleware_1 = require("../../base/getAuthenticationMiddleware");
const getSchema_1 = require("./getSchema");
const getSubscriptionOptions_1 = require("./observeDomainEvents/getSubscriptionOptions");
const graphql_1 = require("graphql");
const withLogMetadata_1 = require("../../../common/utils/logging/withLogMetadata");
const flaschenpost_1 = require("flaschenpost");
const errors = __importStar(require("../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getV2 = async function ({ corsOrigin, application, identityProviders, handleCommand, observeDomainEvents, observeNotifications, queryView, enableIntegratedClient, webSocketEndpoint }) {
    if (!webSocketEndpoint && (observeDomainEvents || observeNotifications)) {
        throw new errors.ParameterInvalid('If observe domain events or observe notifications is enabled, a websocket endpoint must be given.');
    }
    const api = await getApiBase_1.getApiBase({
        request: {
            headers: {
                cors: { origin: corsOrigin },
                // If the GraphQL playground is enabled, CSP must be disabled for the apollo cdn to work.
                csp: !enableIntegratedClient
            },
            body: { parser: { sizeLimit: 100000 } },
            query: { parser: { useJson: false } }
        },
        response: {
            headers: { cache: false }
        }
    });
    api.use(flaschenpost_1.getMiddleware());
    const authenticationMiddleware = await getAuthenticationMiddleware_1.getAuthenticationMiddleware({
        identityProviders
    });
    api.use(authenticationMiddleware);
    const { schema, publishDomainEvent } = await getSchema_1.getSchema({
        application,
        handleCommand,
        observeDomainEvents,
        observeNotifications,
        queryView
    });
    const schemaValidationErrors = graphql_1.validateSchema(schema);
    if (schemaValidationErrors.length > 0) {
        for (const error of schemaValidationErrors) {
            logger.fatal('GraphQL schema validation failed.', withLogMetadata_1.withLogMetadata('api', 'graphql', { error }));
        }
        throw new errors.GraphQlError('GraphQL schema validation failed.');
    }
    const graphqlServer = new apollo_server_express_1.ApolloServer({
        schema,
        context({ req, connection }) {
            if (observeDomainEvents !== false && connection) {
                // If observeDomainEvents is true, the value returned here will be added
                // to the connection context when a WebSocket connection is initialized.
                // This way the clientMetadata is available in the subscription
                // resolvers.
                return connection.context;
            }
            return { clientMetadata: new ClientMetadata_1.ClientMetadata({ req }) };
        },
        subscriptions: webSocketEndpoint ?
            getSubscriptionOptions_1.getSubscriptionOptions({
                identityProviders,
                webSocketEndpoint,
                issuerForAnonymousTokens: 'https://token.invalid'
            }) :
            undefined,
        introspection: true,
        playground: enableIntegratedClient ?
            { subscriptionEndpoint: webSocketEndpoint } :
            false
    });
    graphqlServer.applyMiddleware({
        app: api,
        path: '/',
        cors: false
    });
    const initializeGraphQlOnServer = async ({ server }) => {
        graphqlServer.installSubscriptionHandlers(server);
    };
    return { api, publishDomainEvent, initializeGraphQlOnServer };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map