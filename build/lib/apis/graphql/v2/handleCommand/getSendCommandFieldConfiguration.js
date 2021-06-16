"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSendCommandFieldConfiguration = void 0;
const getIndividualCommandFieldConfiguration_1 = require("./getIndividualCommandFieldConfiguration");
const graphql_1 = require("graphql");
const getSendCommandFieldConfiguration = function ({ application, onReceiveCommand }) {
    const commandFieldConfigurations = {};
    for (const [contextName, context] of Object.entries(application.domain)) {
        for (const [aggregateName, aggregate] of Object.entries(context)) {
            for (const [commandName, commandHandler] of Object.entries(aggregate.commandHandlers)) {
                commandFieldConfigurations[`${contextName}_${aggregateName}_${commandName}`] = getIndividualCommandFieldConfiguration_1.getIndividualCommandFieldConfiguration({
                    application,
                    contextName,
                    aggregateName,
                    commandName,
                    commandHandler,
                    onReceiveCommand
                });
            }
        }
    }
    return {
        type: new graphql_1.GraphQLObjectType({
            name: 'command',
            fields: commandFieldConfigurations
        }),
        resolve() {
            return {};
        }
    };
};
exports.getSendCommandFieldConfiguration = getSendCommandFieldConfiguration;
//# sourceMappingURL=getSendCommandFieldConfiguration.js.map