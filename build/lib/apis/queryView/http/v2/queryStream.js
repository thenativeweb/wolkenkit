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
exports.queryStream = void 0;
const ClientMetadata_1 = require("../../../../common/utils/http/ClientMetadata");
const executeStreamQueryHandler_1 = require("../../../../common/domain/executeStreamQueryHandler");
const flaschenpost_1 = require("flaschenpost");
const getClientService_1 = require("../../../../common/services/getClientService");
const defekt_1 = require("defekt");
const validateQueryHandlerIdentifier_1 = require("../../../../common/validators/validateQueryHandlerIdentifier");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const writeLine_1 = require("../../../base/writeLine");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const queryStream = {
    description: 'Queries a view and returns a stream.',
    path: ':viewName/stream/:queryName',
    request: {
        query: {
            type: 'object',
            properties: {},
            additionalProperties: false
        }
    },
    response: {
        statusCodes: [200, 400]
    },
    getHandler({ application }) {
        return async function (req, res) {
            try {
                const queryHandlerIdentifier = {
                    view: { name: req.params.viewName },
                    name: req.params.queryName
                };
                validateQueryHandlerIdentifier_1.validateQueryHandlerIdentifier({ application, queryHandlerIdentifier });
                const resultStream = await executeStreamQueryHandler_1.executeStreamQueryHandler({
                    application,
                    queryHandlerIdentifier,
                    options: req.query,
                    services: {
                        client: getClientService_1.getClientService({ clientMetadata: new ClientMetadata_1.ClientMetadata({ req }) })
                    }
                });
                try {
                    res.startStream({ heartbeatInterval: false });
                    for await (const resultItem of resultStream) {
                        writeLine_1.writeLine({ res, data: resultItem });
                    }
                }
                catch (ex) {
                    logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'queryView', { error: ex }));
                }
                finally {
                    res.end();
                }
            }
            catch (ex) {
                const error = defekt_1.isCustomError(ex) ?
                    ex :
                    new errors.UnknownError({ cause: ex });
                switch (error.code) {
                    case errors.ViewNotFound.code:
                    case errors.QueryHandlerNotFound.code:
                    case errors.QueryOptionsInvalid.code: {
                        res.status(400).json({
                            code: error.code,
                            message: error.message
                        });
                        break;
                    }
                    case errors.QueryHandlerTypeMismatch.code: {
                        res.status(400).json({
                            code: error.code,
                            message: 'Can not query for a stream on a value query handler.'
                        });
                        break;
                    }
                    case errors.QueryResultInvalid.code: {
                        logger.error('An invalid query result was occured.', withLogMetadata_1.withLogMetadata('api', 'queryView', { error }));
                        res.status(500).json({
                            code: error.code
                        });
                        break;
                    }
                    default: {
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'queryView', { error }));
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
exports.queryStream = queryStream;
//# sourceMappingURL=queryStream.js.map