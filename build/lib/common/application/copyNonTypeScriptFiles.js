"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyNonTypeScriptFiles = void 0;
const exists_1 = require("../utils/fs/exists");
const path_1 = __importDefault(require("path"));
const readdirRecursive_1 = require("../utils/fs/readdirRecursive");
const shelljs_1 = require("shelljs");
const copyNonTypeScriptFiles = async function ({ sourceDirectory, targetDirectory }) {
    const { directories, files } = await readdirRecursive_1.readdirRecursive({ path: sourceDirectory });
    for (const directory of directories) {
        shelljs_1.mkdir('-p', path_1.default.join(targetDirectory, directory));
    }
    const nonTypeScriptFiles = files.filter((file) => path_1.default.extname(file) !== '.ts');
    for (const file of nonTypeScriptFiles) {
        const targetFile = path_1.default.join(targetDirectory, file);
        if (await exists_1.exists({ path: targetFile })) {
            continue;
        }
        const sourceFile = path_1.default.join(sourceDirectory, file);
        shelljs_1.cp(sourceFile, targetFile);
    }
};
exports.copyNonTypeScriptFiles = copyNonTypeScriptFiles;
//# sourceMappingURL=copyNonTypeScriptFiles.js.map