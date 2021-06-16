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
exports.postPerformReplay = void 0;
const flaschenpost_1 = require("flaschenpost");
const getAggregateIdentifierSchema_1 = require("../../../../common/schemas/getAggregateIdentifierSchema");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const validateAggregateIdentifier_1 = require("../../../../common/validators/validateAggregateIdentifier");
const validateContentType_1 = require("../../../base/validateContentType");
const validateFlowNames_1 = require("../../../../common/validators/validateFlowNames");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const postPerformReplay = {
    description: 'Performs a replay.',
    path: '',
    request: {
        body: {
            type: 'object',
            properties: {
                flowNames: {
                    type: 'array',
                    items: { type: 'string', minLength: 1 },
                    minItems: 1
                },
                aggregates: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            aggregateIdentifier: getAggregateIdentifierSchema_1.getAggregateIdentifierSchema(),
                            from: { type: 'number', minimum: 1 },
                            to: { type: 'number', minimum: 1 }
                        },
                        required: ['aggregateIdentifier', 'from', 'to']
                    },
                    minItems: 1
                }
            },
            required: ['aggregates'],
            additionalProperties: false
        }
    },
    response: {
        statusCodes: [200, 400, 415],
        body: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: false
        }
    },
    getHandler({ performReplay, application }) {
        const requestBodyParser = new validate_value_1.Parser(postPerformReplay.request.body), responseBodyParser = new validate_value_1.Parser(postPerformReplay.response.body);
        return async function (req, res) {
            try {
                validateContentType_1.validateContentType({
                    expectedContentType: 'application/json',
                    req
                });
                requestBodyParser.parse(req.body, { valueName: 'requestBody' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                const { flowNames = Object.keys(application.flows), aggregates } = req.body;
                validateFlowNames_1.validateFlowNames({ flowNames, application });
                for (const aggregate of aggregates) {
                    validateAggregateIdentifier_1.validateAggregateIdentifier({
                        aggregateIdentifier: aggregate.aggregateIdentifier,
                        application
                    });
                }
                logger.debug('Received request for replay.', withLogMetadata_1.withLogMetadata('api', 'performReplay', { flowNames, aggregates }));
                await performReplay({ flowNames, aggregates });
                const response = {};
                responseBodyParser.parse(response, { valueName: 'responseBody' }).unwrapOrThrow();
                res.status(200).json(response);
            }
            catch (ex) {
                const error = defekt_1.isCustomError(ex) ?
                    ex :
                    new errors.UnknownError({ cause: ex });
                switch (error.code) {
                    case errors.ContentTypeMismatch.code: {
                        res.status(415).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    case errors.RequestMalformed.code:
                    case errors.FlowNotFound.code:
                    case errors.ContextNotFound.code:
                    case errors.AggregateNotFound.code: {
                        res.status(400).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    default: {
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'performReplay', { error }));
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
exports.postPerformReplay = postPerformReplay;
//# sourceMappingURL=postPerformReplay.js.map