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
exports.getFile = void 0;
const ClientMetadata_1 = require("../../../../common/utils/http/ClientMetadata");
const flaschenpost_1 = require("flaschenpost");
const getClientService_1 = require("../../../../common/services/getClientService");
const getErrorService_1 = require("../../../../common/services/getErrorService");
const getLoggerService_1 = require("../../../../common/services/getLoggerService");
const defekt_1 = require("defekt");
const validate_value_1 = require("validate-value");
const stream_1 = require("stream");
const util_1 = require("util");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const pipeline = util_1.promisify(stream_1.pipeline);
const logger = flaschenpost_1.flaschenpost.getLogger();
const getFile = {
    description: 'Returns the requested file.',
    path: 'file/:id',
    request: {},
    response: {
        statusCodes: [200, 400, 401, 404, 500],
        stream: true
    },
    getHandler({ application, fileStore }) {
        const uuidParser = new validate_value_1.Parser({ type: 'string', format: 'uuid' });
        return async function (req, res) {
            try {
                const { id } = req.params;
                uuidParser.parse(id, { valueName: 'uuid' }).unwrapOrThrow((err) => new errors.RequestMalformed(err.message));
                const clientService = getClientService_1.getClientService({ clientMetadata: new ClientMetadata_1.ClientMetadata({ req }) });
                const fileMetadata = await fileStore.getMetadata({ id });
                if (application.hooks.gettingFile) {
                    const errorService = getErrorService_1.getErrorService({ errors: ['NotAuthenticated'] });
                    await application.hooks.gettingFile(fileMetadata, {
                        client: clientService,
                        error: errorService,
                        infrastructure: application.infrastructure,
                        logger: getLoggerService_1.getLoggerService({
                            fileName: '<app>/server/hooks/gettingFile',
                            packageManifest: application.packageManifest
                        })
                    });
                }
                const stream = await fileStore.getFile({ id });
                res.set('x-id', fileMetadata.id);
                res.set('x-name', fileMetadata.name);
                res.set('content-type', fileMetadata.contentType);
                res.set('content-length', String(fileMetadata.contentLength));
                res.set('content-disposition', `inline; filename=${fileMetadata.name}`);
                await pipeline(stream, res);
                try {
                    if (application.hooks.gotFile) {
                        await application.hooks.gotFile(fileMetadata, {
                            client: clientService,
                            infrastructure: application.infrastructure,
                            logger: getLoggerService_1.getLoggerService({
                                fileName: '<app>/server/hooks/gotFile',
                                packageManifest: application.packageManifest
                            })
                        });
                    }
                }
                catch (ex) {
                    logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'manageFile', { error: ex }));
                }
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
                    case errors.FileNotFound.code: {
                        res.status(404).json({
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
exports.getFile = getFile;
//# sourceMappingURL=getFile.js.map