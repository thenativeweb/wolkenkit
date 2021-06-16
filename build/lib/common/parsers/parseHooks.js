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
exports.parseHooks = void 0;
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseHooks = function ({ hooksDefinition }) {
    if (!lodash_1.isObjectLike(hooksDefinition)) {
        return defekt_1.error(new errors.HooksDefinitionMalformed('Hooks definition is not an object.'));
    }
    if (!lodash_1.isUndefined(hooksDefinition.addingFile) && !lodash_1.isFunction(hooksDefinition.addingFile)) {
        return defekt_1.error(new errors.HooksDefinitionMalformed(`Property 'addingFile' is not a function.`));
    }
    if (!lodash_1.isUndefined(hooksDefinition.addedFile) && !lodash_1.isFunction(hooksDefinition.addedFile)) {
        return defekt_1.error(new errors.HooksDefinitionMalformed(`Property 'addedFile' is not a function.`));
    }
    if (!lodash_1.isUndefined(hooksDefinition.gettingFile) && !lodash_1.isFunction(hooksDefinition.gettingFile)) {
        return defekt_1.error(new errors.HooksDefinitionMalformed(`Property 'gettingFile' is not a function.`));
    }
    if (!lodash_1.isUndefined(hooksDefinition.gotFile) && !lodash_1.isFunction(hooksDefinition.gotFile)) {
        return defekt_1.error(new errors.HooksDefinitionMalformed(`Property 'gotFile' is not a function.`));
    }
    if (!lodash_1.isUndefined(hooksDefinition.removingFile) && !lodash_1.isFunction(hooksDefinition.removingFile)) {
        return defekt_1.error(new errors.HooksDefinitionMalformed(`Property 'removingFile' is not a function.`));
    }
    if (!lodash_1.isUndefined(hooksDefinition.removedFile) && !lodash_1.isFunction(hooksDefinition.removedFile)) {
        return defekt_1.error(new errors.HooksDefinitionMalformed(`Property 'removedFile' is not a function.`));
    }
    return defekt_1.value(hooksDefinition);
};
exports.parseHooks = parseHooks;
//# sourceMappingURL=parseHooks.js.map