"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationPackageJson = void 0;
const fs_1 = __importDefault(require("fs"));
const getApplicationRoot_1 = require("./getApplicationRoot");
const path_1 = __importDefault(require("path"));
const getApplicationPackageJson = async function ({ directory }) {
    const applicationRoot = await getApplicationRoot_1.getApplicationRoot({ directory });
    const applicationPackageJsonPath = path_1.default.join(applicationRoot, 'package.json');
    const applicationPackageJson = await fs_1.default.promises.readFile(applicationPackageJsonPath, 'utf8');
    const packageManifest = JSON.parse(applicationPackageJson);
    return packageManifest;
};
exports.getApplicationPackageJson = getApplicationPackageJson;
//# sourceMappingURL=getApplicationPackageJson.js.map