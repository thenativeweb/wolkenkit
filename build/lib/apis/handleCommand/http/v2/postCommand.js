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
const ClientMetadata_1 = require("../../../../common/utils/http/ClientMetadata");
const Command_1 = require("../../../../common/elements/Command");
const CommandWithMetadata_1 = require("../../../../common/elements/CommandWithMetadata");
const flaschenpost_1 = require("flaschenpost");
const getCommandSchema_1 = require("../../../../common/schemas/getCommandSchema");
const defekt_1 = require("defekt");
const uuid_1 = require("uuid");
const validateCommand_1 = require("../../../../common/validators/validateCommand");
const validateContentType_1 = require("../../../base/validateContentType");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const validate_value_1 = require("validate-value");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const postCommand = {
    description: 'Accepts a command for further processing.',
    path: ':contextName/:aggregateName/:aggregateId/:commandName',
    request: {
        body: { type: 'object' }
    },
    response: {
        statusCodes: [200, 400, 401, 415],
        body: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                aggregateIdentifier: {
                    type: 'object',
                    properties: {
                        aggregate: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' }
                            },
                            required: ['id'],
                            additionalProperties: false
                        }
                    },
                    required: ['aggregate'],
                    additionalProperties: false
                }
            },
            required: ['id', 'aggregateIdentifier'],
            additionalProperties: false
        }
    },
    getHandler({ onReceiveCommand, application }) {
        const responseBodyParser = new validate_value_1.Parser(postCommand.response.body);
        return async function (req, res) {
            try {
                validateContentType_1.validateContentType({
                    expectedContentType: 'application/json',
                    req
                });
                const command = new Command_1.Command({
                    aggregateIdentifier: {
                        context: {
                            name: req.params.contextName
                        },
                        aggregate: {
                            name: req.params.aggregateName,
                            id: req.params.aggregateId
                        }
                    },
                    name: req.params.commandName,
                    data: req.body
                });
                validate_value_1.parse(command, getCommandSchema_1.getCommandSchema(), { valueName: 'command' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                validateCommand_1.validateCommand({ command, application });
                const commandId = uuid_1.v4();
                const commandWithMetadata = new CommandWithMetadata_1.CommandWithMetadata({
                    ...command,
                    id: commandId,
                    metadata: {
                        causationId: commandId,
                        correlationId: commandId,
                        timestamp: Date.now(),
                        client: new ClientMetadata_1.ClientMetadata({ req }),
                        initiator: { user: req.user }
                    }
                });
                logger.debug('Received command.', withLogMetadata_1.withLogMetadata('api', 'handleCommand', { command: commandWithMetadata }));
                await onReceiveCommand({ command: commandWithMetadata });
                const response = {
                    id: commandId,
                    aggregateIdentifier: {
                        aggregate: {
                            id: commandWithMetadata.aggregateIdentifier.aggregate.id
                        }
                    }
                };
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
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'handleCommand', { error }));
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