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
exports.validateQueryHandlerIdentifier = void 0;
const errors = __importStar(require("../errors"));
const validateQueryHandlerIdentifier = function ({ queryHandlerIdentifier, application }) {
    const viewDefinitions = application.views;
    const { view: { name: viewName }, name } = queryHandlerIdentifier;
    if (!(viewName in viewDefinitions)) {
        throw new errors.ViewNotFound(`View '${viewName}' not found.`);
    }
    if (!(name in viewDefinitions[viewName].queryHandlers)) {
        throw new errors.QueryHandlerNotFound(`Query handler '${viewName}.${name}' not found.`);
    }
};
exports.validateQueryHandlerIdentifier = validateQueryHandlerIdentifier;
//# sourceMappingURL=validateQueryHandlerIdentifier.js.map