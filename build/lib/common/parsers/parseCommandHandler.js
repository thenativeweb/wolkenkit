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
exports.parseCommandHandler = void 0;
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseCommandHandler = function ({ commandHandler }) {
    if (!lodash_1.isObjectLike(commandHandler)) {
        return defekt_1.error(new errors.CommandHandlerMalformed(`Property 'commandHandler' is not an object.`));
    }
    if (lodash_1.isUndefined(commandHandler.isAuthorized)) {
        return defekt_1.error(new errors.CommandHandlerMalformed(`Function 'isAuthorized' is missing.`));
    }
    if (!lodash_1.isFunction(commandHandler.isAuthorized)) {
        return defekt_1.error(new errors.CommandHandlerMalformed(`Property 'isAuthorized' is not a function.`));
    }
    if (lodash_1.isUndefined(commandHandler.handle)) {
        return defekt_1.error(new errors.CommandHandlerMalformed(`Function 'handle' is missing.`));
    }
    if (!lodash_1.isFunction(commandHandler.handle)) {
        return defekt_1.error(new errors.CommandHandlerMalformed(`Property 'handle' is not a function.`));
    }
    if (!lodash_1.isUndefined(commandHandler.getDocumentation) && !lodash_1.isFunction(commandHandler.getDocumentation)) {
        return defekt_1.error(new errors.CommandHandlerMalformed(`Property 'getDocumentation' is not a function.`));
    }
    if (!lodash_1.isUndefined(commandHandler.getSchema) && !lodash_1.isFunction(commandHandler.getSchema)) {
        return defekt_1.error(new errors.CommandHandlerMalformed(`Property 'getSchema' is not a function.`));
    }
    return defekt_1.value(commandHandler);
};
exports.parseCommandHandler = parseCommandHandler;
//# sourceMappingURL=parseCommandHandler.js.map