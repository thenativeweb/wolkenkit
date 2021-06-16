"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const getFiles = async function ({ directory, recursive = true, predicate = () => true }) {
    const result = [];
    const entries = await fs_1.default.promises.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const entryFullName = path_1.default.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (recursive) {
                result.push(...await getFiles({ directory: entryFullName, predicate, recursive }));
            }
            continue;
        }
        if (!predicate(entry)) {
            continue;
        }
        result.push(entryFullName);
    }
    return result;
};
exports.getFiles = getFiles;
//# sourceMappingURL=getFiles.js.map