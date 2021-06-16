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
exports.compileWithTypeScript = void 0;
const shelljs_1 = require("shelljs");
const exists_1 = require("../utils/fs/exists");
const common_tags_1 = require("common-tags");
const errors = __importStar(require("../errors"));
const compileWithTypeScript = async function ({ sourceDirectory, targetDirectory }) {
    if (!await exists_1.exists({ path: sourceDirectory })) {
        throw new errors.CompilationFailed('Source folder does not exist.');
    }
    const shellQuote = process.platform === 'win32' ? `"` : `'`;
    const { code, stdout, stderr } = shelljs_1.exec(common_tags_1.oneLine `
    npx tsc
      --module CommonJS
      --noEmitOnError
      --outDir ${shellQuote}${targetDirectory}${shellQuote}
  `, { cwd: sourceDirectory });
    if (code !== 0) {
        throw new errors.CompilationFailed({ message: 'Compilation failed.', data: { stdout, stderr } });
    }
};
exports.compileWithTypeScript = compileWithTypeScript;
//# sourceMappingURL=compileWithTypeScript.js.map