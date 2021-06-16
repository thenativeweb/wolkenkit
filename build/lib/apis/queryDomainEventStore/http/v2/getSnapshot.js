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
exports.getSnapshot = void 0;
const flaschenpost_1 = require("flaschenpost");
const getAggregateIdentifierSchema_1 = require("../../../../common/schemas/getAggregateIdentifierSchema");
const getSnapshotSchema_1 = require("../../../../common/schemas/getSnapshotSchema");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getSnapshot = {
    description: 'Returns the latest snapshot for an aggeragte.',
    path: 'snapshot',
    request: {
        query: {
            type: 'object',
            properties: {
                aggregateIdentifier: getAggregateIdentifierSchema_1.getAggregateIdentifierSchema()
            },
            required: ['aggregateIdentifier'],
            additionalProperties: false
        }
    },
    response: {
        statusCodes: [200, 400, 404],
        body: getSnapshotSchema_1.getSnapshotSchema()
    },
    getHandler({ domainEventStore }) {
        const queryParser = new validate_value_1.Parser(getSnapshot.request.query), responseBodyParser = new validate_value_1.Parser(getSnapshot.response.body);
        return async function (req, res) {
            try {
                const { aggregateIdentifier } = req.query;
                queryParser.parse(req.query, { valueName: 'requestQuery' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });
                if (!snapshot) {
                    throw new errors.SnapshotNotFound();
                }
                responseBodyParser.parse(snapshot, { valueName: 'responseBody' }).unwrapOrThrow();
                res.json(snapshot);
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
                    case errors.SnapshotNotFound.code: {
                        res.status(404).json({
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
exports.getSnapshot = getSnapshot;
//# sourceMappingURL=getSnapshot.js.map