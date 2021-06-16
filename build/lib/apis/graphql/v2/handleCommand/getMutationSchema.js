"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMutationSchema = void 0;
const getCancelCommandFieldConfiguration_1 = require("./getCancelCommandFieldConfiguration");
const getSendCommandFieldConfiguration_1 = require("./getSendCommandFieldConfiguration");
const graphql_1 = require("graphql");
const getMutationSchema = function ({ application, onReceiveCommand, onCancelCommand }) {
    return new graphql_1.GraphQLObjectType({
        name: 'Mutation',
        fields: {
            command: getSendCommandFieldConfiguration_1.getSendCommandFieldConfiguration({ application, onReceiveCommand }),
            cancel: getCancelCommandFieldConfiguration_1.getCancelCommandFieldConfiguration({ application, onCancelCommand })
        }
    });
};
exports.getMutationSchema = getMutationSchema;
//# sourceMappingURL=getMutationSchema.js.map