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
exports.parseDomainEventHandler = void 0;
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseDomainEventHandler = function ({ domainEventHandler }) {
    if (!lodash_1.isObjectLike(domainEventHandler)) {
        return defekt_1.error(new errors.DomainEventHandlerMalformed(`Property 'domainEventHandler' is not an object.`));
    }
    if (lodash_1.isUndefined(domainEventHandler.handle)) {
        return defekt_1.error(new errors.DomainEventHandlerMalformed(`Function 'handle' is missing.`));
    }
    if (!lodash_1.isFunction(domainEventHandler.handle)) {
        return defekt_1.error(new errors.DomainEventHandlerMalformed(`Property 'handle' is not a function.`));
    }
    if (lodash_1.isUndefined(domainEventHandler.isAuthorized)) {
        return defekt_1.error(new errors.DomainEventHandlerMalformed(`Function 'isAuthorized' is missing.`));
    }
    if (!lodash_1.isFunction(domainEventHandler.isAuthorized)) {
        return defekt_1.error(new errors.DomainEventHandlerMalformed(`Property 'isAuthorized' is not a function.`));
    }
    if (!lodash_1.isUndefined(domainEventHandler.getDocumentation) && !lodash_1.isFunction(domainEventHandler.getDocumentation)) {
        return defekt_1.error(new errors.DomainEventHandlerMalformed(`Property 'getDocumentation' is not a function.`));
    }
    if (!lodash_1.isUndefined(domainEventHandler.getSchema) && !lodash_1.isFunction(domainEventHandler.getSchema)) {
        return defekt_1.error(new errors.DomainEventHandlerMalformed(`Property 'getSchema' is not a function.`));
    }
    if (!lodash_1.isUndefined(domainEventHandler.filter) && !lodash_1.isFunction(domainEventHandler.filter)) {
        return defekt_1.error(new errors.DomainEventHandlerMalformed(`Property 'filter' is not a function.`));
    }
    if (!lodash_1.isUndefined(domainEventHandler.map) && !lodash_1.isFunction(domainEventHandler.map)) {
        return defekt_1.error(new errors.DomainEventHandlerMalformed(`Property 'map' is not a function.`));
    }
    return defekt_1.value(domainEventHandler);
};
exports.parseDomainEventHandler = parseDomainEventHandler;
//# sourceMappingURL=parseDomainEventHandler.js.map