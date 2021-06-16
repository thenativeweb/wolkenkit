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
exports.storeDomainEvents = void 0;
const DomainEvent_1 = require("../../../../common/elements/DomainEvent");
const flaschenpost_1 = require("flaschenpost");
const getDomainEventSchema_1 = require("../../../../common/schemas/getDomainEventSchema");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const validateContentType_1 = require("../../../base/validateContentType");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const domainEventParser = new validate_value_1.Parser(getDomainEventSchema_1.getDomainEventSchema());
const logger = flaschenpost_1.flaschenpost.getLogger();
const storeDomainEvents = {
    description: 'Stores domain events.',
    path: 'store-domain-events',
    request: {
        body: {
            type: 'array',
            items: getDomainEventSchema_1.getDomainEventSchema()
        }
    },
    response: {
        statusCodes: [200, 400, 409, 415],
        body: { type: 'object' }
    },
    getHandler({ domainEventStore }) {
        const responseBodySchema = new validate_value_1.Parser(storeDomainEvents.response.body);
        return async function (req, res) {
            try {
                validateContentType_1.validateContentType({
                    expectedContentType: 'application/json',
                    req
                });
                if (!Array.isArray(req.body)) {
                    throw new errors.RequestMalformed('Request body must be an array of domain events.');
                }
                if (req.body.length === 0) {
                    throw new errors.ParameterInvalid('Domain events are missing.');
                }
                const domainEvents = req.body.map((domainEvent) => new DomainEvent_1.DomainEvent(domainEvent));
                for (const domainEvent of domainEvents) {
                    domainEventParser.parse(domainEvent).unwrapOrThrow((err) => new errors.DomainEventMalformed(err.message));
                }
                await domainEventStore.storeDomainEvents({ domainEvents });
                const response = {};
                responseBodySchema.parse(response, { valueName: 'responseBody' }).unwrapOrThrow();
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
                    case errors.ParameterInvalid.code:
                    case errors.DomainEventMalformed.code: {
                        res.status(400).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    case errors.RevisionAlreadyExists.code: {
                        res.status(409).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    default: {
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'writeDomainEventStore', { error }));
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
exports.storeDomainEvents = storeDomainEvents;
//# sourceMappingURL=storeDomainEvents.js.map