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
exports.parseFlow = void 0;
const parseFlowHandler_1 = require("./parseFlowHandler");
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseFlow = function ({ flowDefinition }) {
    if (!lodash_1.isObjectLike(flowDefinition)) {
        return defekt_1.error(new errors.FlowDefinitionMalformed('Flow handler is not an object.'));
    }
    if (lodash_1.isUndefined(flowDefinition.domainEventHandlers)) {
        return defekt_1.error(new errors.FlowDefinitionMalformed(`Object 'domainEventHandlers' is missing.`));
    }
    if (!lodash_1.isObjectLike(flowDefinition.domainEventHandlers)) {
        return defekt_1.error(new errors.FlowDefinitionMalformed(`Property 'domainEventHandlers' is not an object.`));
    }
    for (const [domainEventHandlerName, domainEventHandler] of Object.entries(flowDefinition.domainEventHandlers)) {
        const parseResult = parseFlowHandler_1.parseFlowHandler({ domainEventHandler });
        if (parseResult.hasError()) {
            return defekt_1.error(new errors.FlowDefinitionMalformed(`Domain event handler '${domainEventHandlerName}' is malformed: ${parseResult.error.message}`));
        }
    }
    if (!lodash_1.isUndefined(flowDefinition.enhancers)) {
        if (!lodash_1.isArray(flowDefinition.enhancers)) {
            return defekt_1.error(new errors.FlowDefinitionMalformed(`Property 'enhancers' is not an array.`));
        }
        for (const [index, enhancer] of flowDefinition.enhancers.entries()) {
            if (!lodash_1.isFunction(enhancer)) {
                return defekt_1.error(new errors.FlowDefinitionMalformed(`Flow enhancer at index '${index}' is not a function.`));
            }
        }
    }
    return defekt_1.value(flowDefinition);
};
exports.parseFlow = parseFlow;
//# sourceMappingURL=parseFlow.js.map