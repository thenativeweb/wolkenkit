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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseImageVersionsFromDockerfile = void 0;
const fs_1 = __importDefault(require("fs"));
const errors = __importStar(require("../../../../common/errors"));
const getBaseImageVersionsFromDockerfile = async function ({ dockerfilePath, baseImage }) {
    const dockerfile = await fs_1.default.promises.readFile(dockerfilePath, 'utf8');
    const froms = dockerfile.
        split('\n').
        filter((line) => line.startsWith(`FROM ${baseImage}:`));
    if (froms.length === 0) {
        throw new errors.InvalidOperation(`FROM statements are missing in '${dockerfilePath}'.`);
    }
    const result = froms.map((from, index) => ({
        line: index + 1,
        version: from.split(':')[1]
    }));
    return result;
};
exports.getBaseImageVersionsFromDockerfile = getBaseImageVersionsFromDockerfile;
//# sourceMappingURL=getBaseImageVersionsFromDockerfile.js.map