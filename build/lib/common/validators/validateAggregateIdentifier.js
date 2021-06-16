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
exports.validateAggregateIdentifier = void 0;
const errors = __importStar(require("../errors"));
const validateAggregateIdentifier = function ({ aggregateIdentifier, application }) {
    const contextDefinitions = application.domain;
    if (!(aggregateIdentifier.context.name in contextDefinitions)) {
        throw new errors.ContextNotFound(`Context '${aggregateIdentifier.context.name}' not found.`);
    }
    if (!(aggregateIdentifier.aggregate.name in contextDefinitions[aggregateIdentifier.context.name])) {
        throw new errors.AggregateNotFound(`Aggregate '${aggregateIdentifier.context.name}.${aggregateIdentifier.aggregate.name}' not found.`);
    }
};
exports.validateAggregateIdentifier = validateAggregateIdentifier;
//# sourceMappingURL=validateAggregateIdentifier.js.map