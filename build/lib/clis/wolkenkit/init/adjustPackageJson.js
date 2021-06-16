"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustPackageJson = void 0;
const fs_1 = __importDefault(require("fs"));
const getApplicationRoot_1 = require("../../../common/application/getApplicationRoot");
const path_1 = __importDefault(require("path"));
const sortKeys_1 = require("../../../common/utils/sortKeys");
const versions_1 = require("../../../versions");
const adjustPackageJson = async function ({ packageJson, name, addTypeScript }) {
    const applicationRoot = await getApplicationRoot_1.getApplicationRoot({ directory: __dirname });
    const wolkenkitPackageJsonPath = path_1.default.join(applicationRoot, 'package.json');
    const wolkenkitPackageJson = JSON.parse(await fs_1.default.promises.readFile(wolkenkitPackageJsonPath, 'utf8'));
    const content = JSON.parse(await fs_1.default.promises.readFile(packageJson, 'utf8'));
    content.name = name;
    content.description = `${name} is built with wolkenkit, an open-source CQRS and event-sourcing framework for JavaScript and Node.js.`;
    content.dependencies = sortKeys_1.sortKeys({
        object: {
            ...content.dependencies,
            wolkenkit: wolkenkitPackageJson.version
        }
    });
    content.devDependencies = sortKeys_1.sortKeys({
        object: {
            ...content.devDependencies,
            typescript: addTypeScript ? versions_1.versions.packages.typescript : undefined
        }
    });
    await fs_1.default.promises.writeFile(packageJson, JSON.stringify(content, null, 2), 'utf8');
};
exports.adjustPackageJson = adjustPackageJson;
//# sourceMappingURL=adjustPackageJson.js.map