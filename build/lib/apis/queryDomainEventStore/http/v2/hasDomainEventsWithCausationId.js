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
exports.hasDomainEventsWithCausationId = void 0;
const flaschenpost_1 = require("flaschenpost");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const hasDomainEventsWithCausationId = {
    description: 'Checks wether domain events with a given causation id exist.',
    path: 'has-domain-events-with-causation-id',
    request: {
        query: {
            type: 'object',
            properties: {
                'causation-id': { type: 'string', format: 'uuid' }
            },
            required: ['causation-id'],
            additionalProperties: false
        }
    },
    response: {
        statusCodes: [200],
        body: {
            type: 'object',
            properties: {
                hasDomainEventsWithCausationId: { type: 'boolean' }
            },
            required: ['hasDomainEventsWithCausationId'],
            additionalProperties: false
        }
    },
    getHandler({ domainEventStore }) {
        const queryParser = new validate_value_1.Parser(hasDomainEventsWithCausationId.request.query), responseBodyParser = new validate_value_1.Parser(hasDomainEventsWithCausationId.response.body);
        return async function (req, res) {
            try {
                queryParser.parse(req.query, { valueName: 'requestQuery' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                const causationId = req.query['causation-id'];
                const hasDomainEvents = await domainEventStore.hasDomainEventsWithCausationId({ causationId }), response = { hasDomainEventsWithCausationId: hasDomainEvents };
                responseBodyParser.parse(response, { valueName: 'responseBody' }).unwrapOrThrow();
                res.json(response);
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
                        return res.status(400).json({
                            code: error.code,
                            message: error.message
                        });
                    }
                }
            }
        };
    }
};
exports.hasDomainEventsWithCausationId = hasDomainEventsWithCausationId;
//# sourceMappingURL=hasDomainEventsWithCausationId.js.map