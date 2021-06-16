"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustTsConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const adjustTsConfig = async function ({ tsconfig }) {
    const content = JSON.parse(await fs_1.default.promises.readFile(tsconfig, 'utf8'));
    Reflect.deleteProperty(content.compilerOptions, 'baseUrl');
    Reflect.deleteProperty(content.compilerOptions, 'paths');
    await fs_1.default.promises.writeFile(tsconfig, JSON.stringify(content, null, 2), 'utf8');
};
exports.adjustTsConfig = adjustTsConfig;
//# sourceMappingURL=adjustTsConfig.js.map