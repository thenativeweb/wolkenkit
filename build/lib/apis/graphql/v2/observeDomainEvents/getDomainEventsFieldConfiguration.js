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
exports.getDomainEventsFieldConfiguration = void 0;
const flaschenpost_1 = require("flaschenpost");
const getAggregatesService_1 = require("../../../../common/services/getAggregatesService");
const getApplicationDescription_1 = require("../../../../common/application/getApplicationDescription");
const getClientService_1 = require("../../../../common/services/getClientService");
const getDomainEventSchemaForGraphql_1 = require("../../../../common/schemas/getDomainEventSchemaForGraphql");
const get_graphql_from_jsonschema_1 = require("get-graphql-from-jsonschema");
const getLoggerService_1 = require("../../../../common/services/getLoggerService");
const instantiateGraphqlTypeDefinitions_1 = require("../../shared/instantiateGraphqlTypeDefinitions");
const partof_1 = require("partof");
const prepareForPublication_1 = require("../../../../common/domain/domainEvent/prepareForPublication");
const common_tags_1 = require("common-tags");
const transformDomainEventForGraphql_1 = require("../../shared/elements/transformDomainEventForGraphql");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const graphql_1 = require("graphql");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getDomainEventsFieldConfiguration = function ({ application, repository, domainEventEmitter }) {
    var _a;
    const aggregatesService = getAggregatesService_1.getAggregatesService({ repository });
    const domainEventSchema = getDomainEventSchemaForGraphql_1.getDomainEventSchemaForGraphql();
    const domainEventGraphqlTypeDefinitions = get_graphql_from_jsonschema_1.getGraphqlSchemaFromJsonSchema({
        schema: domainEventSchema,
        rootName: 'DomainEvent',
        direction: 'output'
    });
    let description = '';
    const applicationDescription = getApplicationDescription_1.getApplicationDescription({ application });
    for (const [contextName, context] of Object.entries(applicationDescription.domainEvents)) {
        description += `# Context '${contextName}'\n`;
        for (const [aggregateName, aggregate] of Object.entries(context)) {
            description += `## Aggregate '${aggregateName}'\n`;
            for (const [domainEventName, domainEventDescription] of Object.entries(aggregate)) {
                description += common_tags_1.source `
          ### Domain event '${domainEventName}'

          ${(_a = domainEventDescription.documentation) !== null && _a !== void 0 ? _a : 'No documentation available.'}

              ${domainEventDescription.schema ? JSON.stringify(domainEventDescription.schema, null, 2) : 'No schema found.'}
        `;
                description += '\n';
            }
        }
    }
    return {
        type: instantiateGraphqlTypeDefinitions_1.instantiateGraphqlTypeDefinitions(domainEventGraphqlTypeDefinitions),
        args: {
            filter: {
                type: graphql_1.GraphQLString
            }
        },
        description,
        async *subscribe(innerSource, { filter: jsonFilter }, { clientMetadata }) {
            const clientService = getClientService_1.getClientService({ clientMetadata });
            let filter = {};
            try {
                if (jsonFilter) {
                    filter = JSON.parse(jsonFilter);
                }
            }
            catch {
                throw new errors.ParameterInvalid('Filter must be a valid JSON object.');
            }
            for await (const [domainEvent] of domainEventEmitter) {
                if (!partof_1.partOf(filter, domainEvent)) {
                    continue;
                }
                const preparedDomainEvent = await prepareForPublication_1.prepareForPublication({
                    application,
                    domainEventWithState: domainEvent,
                    domainEventFilter: {},
                    repository,
                    services: {
                        aggregates: aggregatesService,
                        client: clientService,
                        logger: getLoggerService_1.getLoggerService({
                            fileName: `<app>/server/domain/${domainEvent.aggregateIdentifier.context.name}/${domainEvent.aggregateIdentifier.aggregate.name}/`,
                            packageManifest: application.packageManifest
                        }),
                        infrastructure: {
                            ask: application.infrastructure.ask
                        }
                    }
                });
                if (!preparedDomainEvent) {
                    continue;
                }
                const transformedDomainEvent = transformDomainEventForGraphql_1.transformDomainEventForGraphql({
                    domainEvent: preparedDomainEvent
                });
                logger.debug('Publishing domain event to client...', withLogMetadata_1.withLogMetadata('api', 'graphql', { domainEvent: transformedDomainEvent }));
                yield transformedDomainEvent;
            }
        },
        resolve(domainEvent) {
            return domainEvent;
        }
    };
};
exports.getDomainEventsFieldConfiguration = getDomainEventsFieldConfiguration;
//# sourceMappingURL=getDomainEventsFieldConfiguration.js.map