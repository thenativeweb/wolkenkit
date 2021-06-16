"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildImages = void 0;
const fs_1 = __importDefault(require("fs"));
const common_tags_1 = require("common-tags");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const buildImages = async function () {
    const entries = await fs_1.default.promises.readdir(__dirname);
    await Promise.all(entries.map(async (entry) => {
        const imageDirectory = path_1.default.join(__dirname, entry);
        const stat = await fs_1.default.promises.stat(imageDirectory);
        if (!stat.isDirectory()) {
            return;
        }
        const dockerfile = path_1.default.join(imageDirectory, 'Dockerfile');
        const context = path_1.default.join(__dirname, '..');
        const { code } = shelljs_1.default.exec(common_tags_1.oneLine `
      docker build
        -t thenativeweb/${entry}:latest
        -f ${dockerfile}
        ${context}
    `);
        if (code !== 0) {
            throw new Error(`Failed to build ${entry}:latest.`);
        }
    }));
};
exports.buildImages = buildImages;
//# sourceMappingURL=buildImages.js.map