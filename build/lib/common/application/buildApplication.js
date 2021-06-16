"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApplication = void 0;
const compileWithTypeScript_1 = require("./compileWithTypeScript");
const copyNonTypeScriptFiles_1 = require("./copyNonTypeScriptFiles");
const is_typescript_1 = require("is-typescript");
const path_1 = __importDefault(require("path"));
const shelljs_1 = require("shelljs");
const buildApplication = async function ({ applicationDirectory, buildDirectoryOverride }) {
    const serverDirectory = path_1.default.join(applicationDirectory, 'server');
    const buildDirectory = buildDirectoryOverride !== null && buildDirectoryOverride !== void 0 ? buildDirectoryOverride : path_1.default.join(applicationDirectory, 'build');
    const buildServerDirectory = path_1.default.join(buildDirectory, 'server');
    shelljs_1.rm('-rf', buildDirectory);
    if (await is_typescript_1.isTypeScript({ directory: applicationDirectory })) {
        await compileWithTypeScript_1.compileWithTypeScript({
            sourceDirectory: applicationDirectory,
            targetDirectory: buildDirectory
        });
        await copyNonTypeScriptFiles_1.copyNonTypeScriptFiles({
            sourceDirectory: serverDirectory,
            targetDirectory: buildServerDirectory
        });
        return;
    }
    shelljs_1.mkdir('-p', buildServerDirectory);
    shelljs_1.cp('-r', `${serverDirectory}/*`, buildServerDirectory);
};
exports.buildApplication = buildApplication;
//# sourceMappingURL=buildApplication.js.map