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
exports.getReplay = void 0;
const flaschenpost_1 = require("flaschenpost");
const getDomainEventSchema_1 = require("../../../../common/schemas/getDomainEventSchema");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const writeLine_1 = require("../../../base/writeLine");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getReplay = {
    description: 'Streams a replay of all domain events, optionally starting and ending at given revisions.',
    path: 'replay',
    request: {
        query: {
            type: 'object',
            properties: {
                fromTimestamp: { type: 'number', minimum: 0 }
            },
            required: [],
            additionalProperties: false
        }
    },
    response: {
        statusCodes: [200, 400],
        stream: true,
        body: getDomainEventSchema_1.getDomainEventSchema()
    },
    getHandler({ domainEventStore, heartbeatInterval }) {
        const queryParser = new validate_value_1.Parser(getReplay.request.query), responseBodyParser = new validate_value_1.Parser(getReplay.response.body);
        return async function (req, res) {
            try {
                queryParser.parse(req.query, { valueName: 'requestQuery' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                const fromTimestamp = req.query.fromTimestamp;
                res.startStream({ heartbeatInterval });
                const domainEventStream = await domainEventStore.getReplay({ fromTimestamp });
                for await (const domainEvent of domainEventStream) {
                    try {
                        responseBodyParser.parse(domainEvent, { valueName: 'responseBody' }).unwrapOrThrow();
                        writeLine_1.writeLine({ res, data: domainEvent });
                    }
                    catch {
                        logger.warn('Dropped invalid domain event.', withLogMetadata_1.withLogMetadata('api', 'queryDomainEventStore', { domainEvent }));
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
exports.getReplay = getReplay;
//# sourceMappingURL=getReplay.js.map