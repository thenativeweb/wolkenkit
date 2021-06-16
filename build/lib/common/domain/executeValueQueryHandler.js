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
exports.executeValueQueryHandler = void 0;
const getErrorService_1 = require("../services/getErrorService");
const getLoggerService_1 = require("../services/getLoggerService");
const validate_value_1 = require("validate-value");
const validateQueryHandlerIdentifier_1 = require("../validators/validateQueryHandlerIdentifier");
const errors = __importStar(require("../errors"));
const executeValueQueryHandler = async function ({ application, queryHandlerIdentifier, options, services }) {
    var _a;
    validateQueryHandlerIdentifier_1.validateQueryHandlerIdentifier({ application, queryHandlerIdentifier });
    const queryHandler = application.views[queryHandlerIdentifier.view.name].queryHandlers[queryHandlerIdentifier.name];
    if (queryHandler.type !== 'value') {
        throw new errors.QueryHandlerTypeMismatch();
    }
    const optionsParser = new validate_value_1.Parser(queryHandler.getOptionsSchema ? queryHandler.getOptionsSchema() : {}), resultParser = new validate_value_1.Parser(queryHandler.getResultItemSchema ? queryHandler.getResultItemSchema() : {});
    optionsParser.parse(options, { valueName: 'queryHandlerOptions' }).unwrapOrThrow((err) => new errors.QueryOptionsInvalid(err.message));
    const loggerService = (_a = services.logger) !== null && _a !== void 0 ? _a : getLoggerService_1.getLoggerService({
        fileName: `<app>/server/views/${queryHandlerIdentifier.view.name}/queryHandlers/${queryHandlerIdentifier.name}`,
        packageManifest: application.packageManifest
    });
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const result = await queryHandler.handle(options, {
        client: services.client,
        error: getErrorService_1.getErrorService({ errors: ['NotFound'] }),
        infrastructure: application.infrastructure,
        logger: loggerService
    });
    const isAuthorizedServices = {
        client: services.client,
        logger: loggerService
    };
    if (!queryHandler.isAuthorized(result, isAuthorizedServices)) {
        throw new errors.QueryNotAuthorized();
    }
    resultParser.parse(result, { valueName: 'result' }).unwrapOrThrow((err) => new errors.QueryResultInvalid(err.message));
    return result;
};
exports.executeValueQueryHandler = executeValueQueryHandler;
//# sourceMappingURL=executeValueQueryHandler.js.map