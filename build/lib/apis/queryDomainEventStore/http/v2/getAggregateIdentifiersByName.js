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
exports.getAggregateIdentifiersByName = void 0;
const flaschenpost_1 = require("flaschenpost");
const getAggregateIdentifierSchema_1 = require("../../../../common/schemas/getAggregateIdentifierSchema");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const writeLine_1 = require("../../../base/writeLine");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getAggregateIdentifiersByName = {
    description: 'Streams all aggregate identifiers matching the given name that have domain events in the store.',
    path: 'get-aggregate-identifiers-by-name',
    request: {
        query: {
            type: 'object',
            properties: {
                contextName: { type: 'string', minLength: 1 },
                aggregateName: { type: 'string', minLength: 1 }
            },
            required: ['contextName', 'aggregateName'],
            additionalProperties: false
        }
    },
    response: {
        statusCodes: [200, 400],
        stream: true,
        body: getAggregateIdentifierSchema_1.getAggregateIdentifierSchema()
    },
    getHandler({ domainEventStore, heartbeatInterval }) {
        const queryParser = new validate_value_1.Parser(getAggregateIdentifiersByName.request.query), responseBodyParser = new validate_value_1.Parser(getAggregateIdentifiersByName.response.body);
        return async function (req, res) {
            try {
                queryParser.parse(req.query, { valueName: 'requestQuery' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                res.startStream({ heartbeatInterval });
                const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiersByName({
                    contextName: req.query.contextName,
                    aggregateName: req.query.aggregateName
                });
                for await (const aggregateIdentifier of aggregateIdentifierStream) {
                    try {
                        responseBodyParser.parse(aggregateIdentifier, { valueName: 'responseBody' }).unwrapOrThrow();
                        writeLine_1.writeLine({ res, data: aggregateIdentifier });
                    }
                    catch {
                        logger.warn('Dropped invalid aggregate identifier.', withLogMetadata_1.withLogMetadata('api', 'queryDomainEventStore', { aggregateIdentifier }));
                    }
                }
                return res.end();
            }
            catch (ex) {
                const error = defekt_1.isCustomError(ex) ?
                    ex :
                    new errors.UnknownError({ cause: ex });
                switch (error.code) {
                    case errors.RequestMalformed.code: {
                        res.status(400).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    default: {
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'queryDomainEventStore', { error }));
                        res.status(500).json({
                            code: error.code,
                            message: error.message
                        });
                    }
                }
            }
        };
    }
};
exports.getAggregateIdentifiersByName = getAggregateIdentifiersByName;
//# sourceMappingURL=getAggregateIdentifiersByName.js.map