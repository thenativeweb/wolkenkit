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
exports.getInfrastructureDefinition = void 0;
const exists_1 = require("../utils/fs/exists");
const isErrnoException_1 = require("../utils/isErrnoException");
const parseInfrastructureDefinition_1 = require("../parsers/parseInfrastructureDefinition");
const errors = __importStar(require("../errors"));
const getInfrastructureDefinition = async function ({ infrastructureDirectory }) {
    if (!await exists_1.exists({ path: infrastructureDirectory })) {
        throw new errors.DirectoryNotFound(`Directory '<app>/build/server/infrastructure' not found.`);
    }
    let infrastructureDefinition;
    try {
        infrastructureDefinition = (await Promise.resolve().then(() => __importStar(require(infrastructureDirectory)))).default;
    }
    catch (ex) {
        if (ex instanceof SyntaxError) {
            throw new errors.ApplicationMalformed({ message: `Syntax error in '<app>/build/server/infrastructure'.`, cause: ex });
        }
        if (isErrnoException_1.isErrnoException(ex) && ex.code === 'MODULE_NOT_FOUND') {
            throw new errors.ApplicationMalformed({ message: `Missing import in '<app>/build/server/infrastructure'.`, cause: ex });
        }
        // But throw an error if the entry is a directory without importable content.
        throw new errors.FileNotFound(`No infrastructure definition in '<app>/build/server/infrastructure' found.`);
    }
    return parseInfrastructureDefinition_1.parseInfrastructureDefinition({ infrastructureDefinition }).unwrapOrThrow((err) => new errors.InfrastructureDefinitionMalformed(`Infrastructure definition '<app>/build/server/infrastructure' is malformed: ${err.message}`));
};
exports.getInfrastructureDefinition = getInfrastructureDefinition;
//# sourceMappingURL=getInfrastructureDefinition.js.map