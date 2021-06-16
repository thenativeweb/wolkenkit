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
exports.parseQueryHandler = void 0;
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseQueryHandler = function ({ queryHandler }) {
    if (!lodash_1.isObjectLike(queryHandler)) {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Query handler is not an object.`));
    }
    if (lodash_1.isUndefined(queryHandler.type)) {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Property 'type' is missing.`));
    }
    if (queryHandler.type !== 'value' && queryHandler.type !== 'stream') {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Property 'type' must either be 'value' or 'stream'.`));
    }
    if (lodash_1.isUndefined(queryHandler.handle)) {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Function 'handle' is missing.`));
    }
    if (!lodash_1.isFunction(queryHandler.handle)) {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Property 'handle' is not a function.`));
    }
    if (lodash_1.isUndefined(queryHandler.isAuthorized)) {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Function 'isAuthorized' is missing.`));
    }
    if (!lodash_1.isFunction(queryHandler.isAuthorized)) {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Property 'isAuthorized' is not a function.`));
    }
    if (!lodash_1.isUndefined(queryHandler.getDocumentation) && !lodash_1.isFunction(queryHandler.getDocumentation)) {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Property 'getDocumentation' is not a function.`));
    }
    if (!lodash_1.isUndefined(queryHandler.getOptionsSchema) && !lodash_1.isFunction(queryHandler.getOptionsSchema)) {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Property 'getOptionsSchema' is not a function.`));
    }
    if (!lodash_1.isUndefined(queryHandler.getItemSchema) && !lodash_1.isFunction(queryHandler.getItemSchema)) {
        return defekt_1.error(new errors.QueryHandlerMalformed(`Property 'getItemSchema' is not a function.`));
    }
    return defekt_1.value(queryHandler);
};
exports.parseQueryHandler = parseQueryHandler;
//# sourceMappingURL=parseQueryHandler.js.map