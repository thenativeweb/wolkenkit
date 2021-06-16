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
exports.getCancelCommandFieldConfiguration = void 0;
const addMissingPrototype_1 = require("../../../../common/utils/graphql/addMissingPrototype");
const flaschenpost_1 = require("flaschenpost");
const get_graphql_from_jsonschema_1 = require("get-graphql-from-jsonschema");
const getItemIdentifierSchema_1 = require("../../../../common/schemas/getItemIdentifierSchema");
const validate_value_1 = require("validate-value");
const validateItemIdentifier_1 = require("../../../../common/validators/validateItemIdentifier");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const graphql_1 = require("graphql");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getCancelCommandFieldConfiguration = function ({ application, onCancelCommand }) {
    const cancelTypeDefs = get_graphql_from_jsonschema_1.getGraphqlSchemaFromJsonSchema({
        schema: getItemIdentifierSchema_1.getItemIdentifierSchema(),
        rootName: 'CommandIdentifier',
        direction: 'input'
    });
    return {
        type: new graphql_1.GraphQLObjectType({
            name: 'cancel',
            fields: {
                success: {
                    type: graphql_1.GraphQLBoolean,
                    resolve(source) {
                        return source.success;
                    }
                }
            }
        }),
        args: {
            commandIdentifier: {
                type: graphql_1.buildSchema(cancelTypeDefs.typeDefinitions.join('\n')).getType(cancelTypeDefs.typeName)
            }
        },
        async resolve(source, { commandIdentifier: rawCommandIdentifier }, { clientMetadata }) {
            const commandIdentifier = addMissingPrototype_1.addMissingPrototype({ value: rawCommandIdentifier });
            validate_value_1.parse(commandIdentifier, getItemIdentifierSchema_1.getItemIdentifierSchema(), { valueName: 'commandIdentifier' }).unwrapOrThrow((err) => new errors.ItemIdentifierMalformed(err.message));
            validateItemIdentifier_1.validateItemIdentifier({ itemIdentifier: commandIdentifier, application, itemType: 'command' });
            const commandIdentifierWithClient = {
                ...commandIdentifier,
                client: clientMetadata
            };
            logger.debug('Received request to cancel command.', withLogMetadata_1.withLogMetadata('api', 'graphql', { commandIdentifierWithClient }));
            try {
                await onCancelCommand({ commandIdentifierWithClient });
                return { success: true };
            }
            catch {
                return { success: false };
            }
        }
    };
};
exports.getCancelCommandFieldConfiguration = getCancelCommandFieldConfiguration;
//# sourceMappingURL=getCancelCommandFieldConfiguration.js.map