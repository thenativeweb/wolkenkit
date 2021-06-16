"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbsolutePath = void 0;
const untildify_1 = __importDefault(require("untildify"));
// eslint-disable-next-line unicorn/import-style
const path_1 = require("path");
const getAbsolutePath = function ({ path, cwd }) {
    const untilfiedPath = untildify_1.default(path);
    if (path_1.isAbsolute(untilfiedPath)) {
        return untilfiedPath;
    }
    const absolutePath = path_1.join(cwd, path);
    return absolutePath;
};
exports.getAbsolutePath = getAbsolutePath;
//# sourceMappingURL=getAbsolutePath.js.map