"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exists = void 0;
const fs_1 = __importDefault(require("fs"));
const isErrnoException_1 = require("../isErrnoException");
const exists = async function ({ path }) {
    try {
        await fs_1.default.promises.access(path, fs_1.default.constants.R_OK);
    }
    catch (ex) {
        if (isErrnoException_1.isErrnoException(ex) && ex.code === 'ENOENT') {
            return false;
        }
        throw ex;
    }
    return true;
};
exports.exists = exists;
//# sourceMappingURL=exists.js.map