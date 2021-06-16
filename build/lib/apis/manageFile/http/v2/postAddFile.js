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
exports.postAddFile = void 0;
const ClientMetadata_1 = require("../../../../common/utils/http/ClientMetadata");
const flaschenpost_1 = require("flaschenpost");
const getClientService_1 = require("../../../../common/services/getClientService");
const getErrorService_1 = require("../../../../common/services/getErrorService");
const getLoggerService_1 = require("../../../../common/services/getLoggerService");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const contentTypeRegex = /^\w+\/[-.\w]+(?:\+[-.\w]+)?$/u;
// eslint-disable-next-line @typescript-eslint/no-base-to-string
const contentTypeRegexAsString = contentTypeRegex.toString().slice(1, -2);
const postAddFile = {
    description: 'Adds a file.',
    path: 'add-file',
    request: {
        headers: {
            type: 'object',
            properties: {
                'x-id': { type: 'string', format: 'uuid' },
                'x-name': { type: 'string', minLength: 1 },
                'content-type': { type: 'string', pattern: contentTypeRegexAsString }
            },
            required: [],
            additionalProperties: true
        }
    },
    response: {
        statusCodes: [200, 400, 401, 409, 500],
        body: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: false
        }
    },
    getHandler({ application, fileStore }) {
        const requestHeadersParser = new validate_value_1.Parser(postAddFile.request.headers), responseBodyParser = new validate_value_1.Parser(postAddFile.response.body);
        return async function (req, res) {
            try {
                requestHeadersParser.parse(req.headers, { valueName: 'requestHeaders' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                const clientService = getClientService_1.getClientService({ clientMetadata: new ClientMetadata_1.ClientMetadata({ req }) });
                let fileAddMetadata = {
                    id: req.headers['x-id'],
                    name: req.headers['x-name'],
                    contentType: req.headers['content-type']
                };
                if (application.hooks.addingFile) {
                    const errorService = getErrorService_1.getErrorService({ errors: ['NotAuthenticated'] });
                    fileAddMetadata = {
                        ...fileAddMetadata,
                        ...await application.hooks.addingFile(fileAddMetadata, {
                            client: clientService,
                            error: errorService,
                            infrastructure: application.infrastructure,
                            logger: getLoggerService_1.getLoggerService({
                                fileName: '<app>/server/hooks/addingFile',
                                packageManifest: application.packageManifest
                            })
                        })
                    };
                }
                const fileMetadata = await fileStore.addFile({
                    ...fileAddMetadata,
                    stream: req
                });
                if (application.hooks.addedFile) {
                    await application.hooks.addedFile(fileMetadata, {
                        client: clientService,
                        infrastructure: application.infrastructure,
                        logger: getLoggerService_1.getLoggerService({
                            fileName: '<app>/server/hooks/addedFile',
                            packageManifest: application.packageManifest
                        })
                    });
                }
                const response = {};
                responseBodyParser.parse(response, { valueName: 'responseBody' }).unwrapOrThrow();
                res.status(200).json(response);
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
                    case errors.NotAuthenticated.code: {
                        res.status(401).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    case errors.FileAlreadyExists.code: {
                        res.status(409).json({
                            code: error.code,
                            message: error.message
                        });
                        return;
                    }
                    default: {
                        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'manageFile', { error }));
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
exports.postAddFile = postAddFile;
//# sourceMappingURL=postAddFile.js.map