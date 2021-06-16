"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchema = void 0;
const getMutationSchema_1 = require("./handleCommand/getMutationSchema");
const getSubscriptionSchema_1 = require("./observeDomainEvents/getSubscriptionSchema");
const getSubscriptionSchema_2 = require("./observeNotifications/getSubscriptionSchema");
const getQuerySchema_1 = require("./queryView/getQuerySchema");
const graphql_1 = require("graphql");
const getSchema = async function ({ application, handleCommand, observeDomainEvents, observeNotifications, queryView }) {
    const graphQlSchemaConfig = {};
    let publishDomainEvent;
    if (handleCommand !== false) {
        graphQlSchemaConfig.mutation = getMutationSchema_1.getMutationSchema({
            application,
            onReceiveCommand: handleCommand.onReceiveCommand,
            onCancelCommand: handleCommand.onCancelCommand
        });
    }
    const subscriptionConfiguration = {
        name: 'Subscription',
        fields: {}
    };
    if (observeDomainEvents) {
        const subscriptionSchemaParts = getSubscriptionSchema_1.getSubscriptionSchema({
            application,
            repository: observeDomainEvents.repository
        });
        subscriptionConfiguration.fields.domainEvents = subscriptionSchemaParts.schema;
        ({ publishDomainEvent } = subscriptionSchemaParts);
    }
    if (observeNotifications) {
        subscriptionConfiguration.fields.notifications = await getSubscriptionSchema_2.getSubscriptionSchema({
            application,
            subscriber: observeNotifications.subscriber,
            channelForNotifications: observeNotifications.channelForNotifications
        });
    }
    graphQlSchemaConfig.subscription = new graphql_1.GraphQLObjectType(subscriptionConfiguration);
    if (queryView) {
        graphQlSchemaConfig.query = getQuerySchema_1.getQuerySchema({
            application
        });
    }
    else {
        graphQlSchemaConfig.query = new graphql_1.GraphQLObjectType({
            name: 'Query',
            fields: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                _: {
                    type: graphql_1.GraphQLBoolean,
                    resolve: () => false
                }
            }
        });
    }
    const schema = new graphql_1.GraphQLSchema(graphQlSchemaConfig);
    return { schema, publishDomainEvent };
};
exports.getSchema = getSchema;
//# sourceMappingURL=getSchema.js.map