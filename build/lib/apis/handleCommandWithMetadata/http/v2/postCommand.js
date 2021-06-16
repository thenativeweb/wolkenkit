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
exports.postCommand = void 0;
const CommandWithMetadata_1 = require("../../../../common/elements/CommandWithMetadata");
const flaschenpost_1 = require("flaschenpost");
const getCommandWithMetadataSchema_1 = require("../../../../common/schemas/getCommandWithMetadataSchema");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const validateCommandWithMetadata_1 = require("../../../../common/validators/validateCommandWithMetadata");
const validateContentType_1 = require("../../../base/validateContentType");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const postCommand = {
    description: 'Accepts a command with metadata for further processing.',
    path: '',
    request: {
        body: getCommandWithMetadataSchema_1.getCommandWithMetadataSchema()
    },
    response: {
        statusCodes: [200, 400, 415],
        body: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' }
            },
            required: ['id'],
            additionalProperties: false
        }
    },
    getHandler({ onReceiveCommand, application }) {
        const requestBodyParser = new validate_value_1.Parser(postCommand.request.body), responseBodyParser = new validate_value_1.Parser(postCommand.response.body);
        return async function (req, res) {
            try {
                validateContentType_1.validateContentType({
                    expectedContentType: 'application/json',
                    req
                });
                requestBodyParser.parse(req.body, { valueName: 'requestBody' }).unwrapOrThrow((err) => new errors.CommandMalformed(err.message));
                const command = new CommandWithMetadata_1.CommandWithMetadata(req.body);
                validateCommandWithMetadata_1.validateCommandWithMetadata({ command, application });
                logger.debug('Received command.', withLogMetadata_1.withLogMetadata('api', 'handleCommandWithMetadata', { command }));
                await onReceiveCommand({ command });
                const response = { id: command.id };
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
                    case errors.ContextNotFound.code:
                    case errors.AggregateNotFound.code:
                    case errors.CommandNotFound.code:
                    case errors.CommandMalformed.code: {
                        res.status(400).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    default: {
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'handleCommandWithMetadata', { error }));
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
exports.postCommand = postCommand;
//# sourceMappingURL=postCommand.js.map