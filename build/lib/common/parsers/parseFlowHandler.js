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
exports.parseFlowHandler = void 0;
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseFlowHandler = function ({ domainEventHandler }) {
    if (!lodash_1.isObjectLike(domainEventHandler)) {
        return defekt_1.error(new errors.FlowDomainEventHandlerMalformed(`Property 'domainEventHandler' is not an object.`));
    }
    if (lodash_1.isUndefined(domainEventHandler.isRelevant)) {
        return defekt_1.error(new errors.FlowDomainEventHandlerMalformed(`Function 'isRelevant' is missing.`));
    }
    if (!lodash_1.isFunction(domainEventHandler.isRelevant)) {
        return defekt_1.error(new errors.FlowDomainEventHandlerMalformed(`Property 'isRelevant' is not a function.`));
    }
    if (lodash_1.isUndefined(domainEventHandler.handle)) {
        return defekt_1.error(new errors.FlowDomainEventHandlerMalformed(`Function 'handle' is missing.`));
    }
    if (!lodash_1.isFunction(domainEventHandler.handle)) {
        return defekt_1.error(new errors.FlowDomainEventHandlerMalformed(`Property 'handle' is not a function.`));
    }
    return defekt_1.value(domainEventHandler);
};
exports.parseFlowHandler = parseFlowHandler;
//# sourceMappingURL=parseFlowHandler.js.map