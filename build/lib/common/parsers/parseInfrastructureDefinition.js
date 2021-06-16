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
exports.parseInfrastructureDefinition = void 0;
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseInfrastructureDefinition = function ({ infrastructureDefinition }) {
    if (!lodash_1.isObjectLike(infrastructureDefinition)) {
        return defekt_1.error(new errors.InfrastructureDefinitionMalformed('Infrastructure definition is not an object.'));
    }
    if (lodash_1.isUndefined(infrastructureDefinition.setupInfrastructure)) {
        return defekt_1.error(new errors.InfrastructureDefinitionMalformed(`Function 'setupInfrastructure' is missing.`));
    }
    if (!lodash_1.isFunction(infrastructureDefinition.setupInfrastructure)) {
        return defekt_1.error(new errors.InfrastructureDefinitionMalformed(`Property 'setupInfrastructure' is not a function.`));
    }
    if (lodash_1.isUndefined(infrastructureDefinition.getInfrastructure)) {
        return defekt_1.error(new errors.InfrastructureDefinitionMalformed(`Function 'getInfrastructure' is missing.`));
    }
    if (!lodash_1.isFunction(infrastructureDefinition.getInfrastructure)) {
        return defekt_1.error(new errors.InfrastructureDefinitionMalformed(`Property 'getInfrastructure' is not a function.`));
    }
    return defekt_1.value(infrastructureDefinition);
};
exports.parseInfrastructureDefinition = parseInfrastructureDefinition;
//# sourceMappingURL=parseInfrastructureDefinition.js.map