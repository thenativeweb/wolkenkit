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
exports.getIndividualCommandFieldConfiguration = void 0;
const addMissingPrototype_1 = require("../../../../common/utils/graphql/addMissingPrototype");
const AggregateIdentifierInputType_1 = require("./AggregateIdentifierInputType");
const AggregateIdentifierType_1 = require("./AggregateIdentifierType");
const lodash_1 = require("lodash");
const Command_1 = require("../../../../common/elements/Command");
const CommandWithMetadata_1 = require("../../../../common/elements/CommandWithMetadata");
const flaschenpost_1 = require("flaschenpost");
const getCommandSchema_1 = require("../../../../common/schemas/getCommandSchema");
const get_graphql_from_jsonschema_1 = require("get-graphql-from-jsonschema");
const instantiateGraphqlTypeDefinitions_1 = require("../../shared/instantiateGraphqlTypeDefinitions");
const validate_value_1 = require("validate-value");
const uuid_1 = require("uuid");
const validateCommand_1 = require("../../../../common/validators/validateCommand");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const graphql_1 = require("graphql");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const commandSchema = new validate_value_1.Parser(getCommandSchema_1.getCommandSchema());
const getIndividualCommandFieldConfiguration = function ({ application, contextName, aggregateName, commandName, commandHandler, onReceiveCommand }) {
    var _a, _b;
    const resolverArguments = {
        aggregateIdentifier: {
            type: AggregateIdentifierInputType_1.AggregateIdentifierInputType
        }
    };
    if (!commandHandler.getSchema) {
        throw new errors.GraphQlError(`Schema in command '${contextName}.${aggregateName}.${commandName}' is missing, but required for GraphQL.`);
    }
    const schema = commandHandler.getSchema();
    if (!('type' in schema && schema.type === 'object' && Object.keys(schema.properties).length === 0)) {
        const typeDefs = get_graphql_from_jsonschema_1.getGraphqlSchemaFromJsonSchema({
            schema: commandHandler.getSchema(),
            rootName: `${contextName}_${aggregateName}_${commandName}`,
            direction: 'input'
        });
        resolverArguments.data = {
            type: instantiateGraphqlTypeDefinitions_1.instantiateGraphqlTypeDefinitions(typeDefs)
        };
    }
    return {
        type: new graphql_1.GraphQLObjectType({
            name: `${contextName}_${aggregateName}_${commandName}`,
            fields: {
                id: {
                    type: graphql_1.GraphQLString
                },
                aggregateIdentifier: {
                    type: AggregateIdentifierType_1.AggregateIdentifierType
                }
            }
        }),
        args: resolverArguments,
        description: (_b = (_a = commandHandler.getDocumentation) === null || _a === void 0 ? void 0 : _a.call(commandHandler)) !== null && _b !== void 0 ? _b : 'No documentation available.',
        async resolve(source, { aggregateIdentifier, data: rawData }, { clientMetadata }) {
            var _a;
            const data = addMissingPrototype_1.addMissingPrototype({ value: rawData });
            const aggregateId = (_a = aggregateIdentifier === null || aggregateIdentifier === void 0 ? void 0 : aggregateIdentifier.id) !== null && _a !== void 0 ? _a : uuid_1.v4();
            const command = new Command_1.Command({
                aggregateIdentifier: {
                    context: { name: contextName },
                    aggregate: { name: aggregateName, id: aggregateId }
                },
                name: commandName,
                data: data === undefined ? {} : lodash_1.cloneDeep(data)
            });
            commandSchema.parse(command, { valueName: 'command' }).unwrapOrThrow((err) => new errors.CommandMalformed(err.message));
            validateCommand_1.validateCommand({ command, application });
            const commandId = uuid_1.v4();
            const commandWithMetadata = new CommandWithMetadata_1.CommandWithMetadata({
                ...command,
                id: commandId,
                metadata: {
                    causationId: commandId,
                    correlationId: commandId,
                    timestamp: Date.now(),
                    client: clientMetadata,
                    initiator: { user: clientMetadata.user }
                }
            });
            logger.debug('Received command.', withLogMetadata_1.withLogMetadata('api', 'graphql', { command: commandWithMetadata }));
            await onReceiveCommand({ command: commandWithMetadata });
            return {
                id: commandId,
                aggregateIdentifier: {
                    id: commandWithMetadata.aggregateIdentifier.aggregate.id
                }
            };
        }
    };
};
exports.getIndividualCommandFieldConfiguration = getIndividualCommandFieldConfiguration;
//# sourceMappingURL=getIndividualCommandFieldConfiguration.js.map