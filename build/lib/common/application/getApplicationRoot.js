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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationRoot = void 0;
const fs_1 = __importDefault(require("fs"));
const isErrnoException_1 = require("../utils/isErrnoException");
const path_1 = __importDefault(require("path"));
const errors = __importStar(require("../errors"));
const getApplicationRoot = async function ({ directory }) {
    try {
        await fs_1.default.promises.access(directory, fs_1.default.constants.R_OK);
    }
    catch (ex) {
        if (isErrnoException_1.isErrnoException(ex) && ex.code === 'ENOENT') {
            throw new errors.DirectoryNotFound();
        }
        throw ex;
    }
    const packageJsonPath = path_1.default.join(directory, 'package.json');
    try {
        await fs_1.default.promises.access(packageJsonPath, fs_1.default.constants.R_OK);
    }
    catch (ex) {
        if (isErrnoException_1.isErrnoException(ex) && ex.code === 'ENOENT') {
            const upperDirectory = path_1.default.join(directory, '..');
            if (upperDirectory === directory) {
                throw new errors.ApplicationNotFound();
            }
            return await getApplicationRoot({ directory: upperDirectory });
        }
        throw ex;
    }
    return directory;
};
exports.getApplicationRoot = getApplicationRoot;
//# sourceMappingURL=getApplicationRoot.js.map