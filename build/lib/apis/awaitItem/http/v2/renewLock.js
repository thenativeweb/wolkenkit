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
exports.renewLock = void 0;
const flaschenpost_1 = require("flaschenpost");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const validateContentType_1 = require("../../../base/validateContentType");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const renewLock = {
    description: 'Renews the timeout of a locked item in the queue.',
    path: 'renew-lock',
    request: {
        body: {
            type: 'object',
            properties: {
                discriminator: { type: 'string', minLength: 1 },
                token: { type: 'string', format: 'uuid' }
            },
            required: ['discriminator', 'token'],
            additionalProperties: false
        }
    },
    response: {
        statusCodes: [],
        body: { type: 'object' }
    },
    getHandler({ priorityQueueStore }) {
        const requestBodyParser = new validate_value_1.Parser(renewLock.request.body), responseBodyParser = new validate_value_1.Parser(renewLock.response.body);
        return async function (req, res) {
            try {
                validateContentType_1.validateContentType({
                    expectedContentType: 'application/json',
                    req
                });
                requestBodyParser.parse(req.body, { valueName: 'requestBody' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                const { discriminator, token } = req.body;
                await priorityQueueStore.renewLock({
                    discriminator,
                    token
                });
                logger.debug('Renewed priority queue item lock.', withLogMetadata_1.withLogMetadata('api', 'awaitItem', { discriminator, token }));
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
                    case errors.RequestMalformed.code: {
                        res.status(400).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    case errors.TokenMismatch.code: {
                        res.status(403).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    case errors.ItemNotFound.code: {
                        res.status(404).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    default: {
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'awaitItem', { error }));
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
exports.renewLock = renewLock;
//# sourceMappingURL=renewLock.js.map