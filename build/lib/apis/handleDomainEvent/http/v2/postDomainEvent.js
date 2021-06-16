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
exports.postDomainEvent = void 0;
const DomainEvent_1 = require("../../../../common/elements/DomainEvent");
const flaschenpost_1 = require("flaschenpost");
const getDomainEventSchema_1 = require("../../../../common/schemas/getDomainEventSchema");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const validateContentType_1 = require("../../../base/validateContentType");
const validateDomainEvent_1 = require("../../../../common/validators/validateDomainEvent");
const validateFlowNames_1 = require("../../../../common/validators/validateFlowNames");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const postDomainEvent = {
    description: 'Accepts a domain event for further processing.',
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
                domainEvent: getDomainEventSchema_1.getDomainEventSchema()
            },
            required: ['domainEvent'],
            additionalProperties: false
        }
    },
    response: {
        statusCodes: [200, 400, 415],
        body: { type: 'object' }
    },
    getHandler({ onReceiveDomainEvent, application }) {
        const requestBodyParser = new validate_value_1.Parser(postDomainEvent.request.body), responseBodyParser = new validate_value_1.Parser(postDomainEvent.response.body);
        return async function (req, res) {
            var _a;
            try {
                validateContentType_1.validateContentType({
                    expectedContentType: 'application/json',
                    req
                });
                requestBodyParser.parse(req.body, { valueName: 'requestBody' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                const flowNames = (_a = req.body.flowNames) !== null && _a !== void 0 ? _a : Object.keys(application.flows);
                const domainEvent = new DomainEvent_1.DomainEvent(req.body.domainEvent);
                validateFlowNames_1.validateFlowNames({ flowNames, application });
                validateDomainEvent_1.validateDomainEvent({ domainEvent, application });
                logger.debug('Received domain event.', withLogMetadata_1.withLogMetadata('api', 'handleDomainEvent', { flowNames, domainEvent }));
                await onReceiveDomainEvent({ flowNames, domainEvent });
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
                    case errors.FlowNotFound.code:
                    case errors.ContextNotFound.code:
                    case errors.AggregateNotFound.code:
                    case errors.DomainEventNotFound.code:
                    case errors.DomainEventMalformed.code:
                    case errors.RequestMalformed.code: {
                        res.status(400).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    default: {
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'handleDomainEvent', { error }));
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
exports.postDomainEvent = postDomainEvent;
//# sourceMappingURL=postDomainEvent.js.map