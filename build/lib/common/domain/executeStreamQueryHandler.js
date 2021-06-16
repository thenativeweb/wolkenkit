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
exports.executeStreamQueryHandler = void 0;
const flaschenpost_1 = require("flaschenpost");
const getLoggerService_1 = require("../services/getLoggerService");
const validate_value_1 = require("validate-value");
const validateQueryHandlerIdentifier_1 = require("../validators/validateQueryHandlerIdentifier");
const withLogMetadata_1 = require("../utils/logging/withLogMetadata");
const stream_1 = require("stream");
const errors = __importStar(require("../errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const executeStreamQueryHandler = async function ({ application, queryHandlerIdentifier, options, services }) {
    var _a;
    validateQueryHandlerIdentifier_1.validateQueryHandlerIdentifier({ application, queryHandlerIdentifier });
    const queryHandler = application.views[queryHandlerIdentifier.view.name].queryHandlers[queryHandlerIdentifier.name];
    if (queryHandler.type !== 'stream') {
        throw new errors.QueryHandlerTypeMismatch();
    }
    const optionsParser = new validate_value_1.Parser(queryHandler.getOptionsSchema ? queryHandler.getOptionsSchema() : {}), resultItemParser = new validate_value_1.Parser(queryHandler.getResultItemSchema ? queryHandler.getResultItemSchema() : {});
    optionsParser.parse(options, { valueName: 'queryHandlerOptions' }).unwrapOrThrow((err) => new errors.QueryOptionsInvalid(err.message));
    const loggerService = (_a = services.logger) !== null && _a !== void 0 ? _a : getLoggerService_1.getLoggerService({
        fileName: `<app>/server/views/${queryHandlerIdentifier.view.name}/queryHandlers/${queryHandlerIdentifier.name}`,
        packageManifest: application.packageManifest
    });
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const resultStream = await queryHandler.handle(options, {
        client: services.client,
        infrastructure: application.infrastructure,
        logger: loggerService
    });
    const isAuthorizedServices = {
        client: services.client,
        logger: loggerService
    };
    const validateStream = new stream_1.Transform({
        objectMode: true,
        transform(resultItem, encoding, callback) {
            if (!queryHandler.isAuthorized(resultItem, isAuthorizedServices)) {
                return callback(null);
            }
            const parseResult = resultItemParser.parse(resultItem, { valueName: 'resultItem' });
            if (parseResult.hasError()) {
                const error = new errors.QueryResultInvalid(parseResult.error.message);
                logger.warn(`An invalid item was omitted from a stream query handler's response.`, withLogMetadata_1.withLogMetadata('common', 'executeStreamQueryHandler', { error }));
                return callback(null);
            }
            return callback(null, resultItem);
        }
    });
    stream_1.pipeline(resultStream, validateStream, (err) => {
        if (err) {
            logger.error('An error occured during stream piping.', withLogMetadata_1.withLogMetadata('common', 'executeStreamQueryHandler', { err }));
        }
    });
    return validateStream;
};
exports.executeStreamQueryHandler = executeStreamQueryHandler;
//# sourceMappingURL=executeStreamQueryHandler.js.map