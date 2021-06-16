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
exports.createFileStore = void 0;
const FileSystem_1 = require("./FileSystem");
const InMemory_1 = require("./InMemory");
const S3_1 = require("./S3");
const errors = __importStar(require("../../common/errors"));
const createFileStore = async function (options) {
    switch (options.type) {
        case 'FileSystem': {
            return FileSystem_1.FileSystemFileStore.create(options);
        }
        case 'InMemory': {
            return InMemory_1.InMemoryFileStore.create(options);
        }
        case 'S3': {
            return S3_1.S3FileStore.create(options);
        }
        default: {
            throw new errors.DatabaseTypeInvalid();
        }
    }
};
exports.createFileStore = createFileStore;
//# sourceMappingURL=createFileStore.js.map