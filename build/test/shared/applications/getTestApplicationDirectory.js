"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestApplicationDirectory = void 0;
const path_1 = __importDefault(require("path"));
const getTestApplicationDirectory = function ({ name, language = 'javascript' }) {
    return path_1.default.join(__dirname, language, name);
};
exports.getTestApplicationDirectory = getTestApplicationDirectory;
//# sourceMappingURL=getTestApplicationDirectory.js.map