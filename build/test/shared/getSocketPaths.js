"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketPaths = void 0;
const temp_1 = __importDefault(require("temp"));
const getSocketPaths = async function ({ count }) {
    const socketPaths = [];
    for (let i = 0; i < count; i++) {
        socketPaths.push(temp_1.default.path({ suffix: '.socket' }));
    }
    return socketPaths;
};
exports.getSocketPaths = getSocketPaths;
//# sourceMappingURL=getSocketPaths.js.map