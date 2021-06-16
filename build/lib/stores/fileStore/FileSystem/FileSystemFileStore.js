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
exports.FileSystemFileStore = void 0;
const exists_1 = require("../../../common/utils/fs/exists");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const stream_1 = require("stream");
const errors = __importStar(require("../../../common/errors"));
const pipeline = util_1.promisify(stream_1.pipeline);
class FileSystemFileStore {
    constructor({ directory }) {
        this.directory = directory;
    }
    static async create({ directory }) {
        return new FileSystemFileStore({ directory });
    }
    async addFile({ id, name, contentType, stream }) {
        const fileDirectory = path_1.default.join(this.directory, id);
        const fileData = path_1.default.join(fileDirectory, 'data');
        const fileMetadata = path_1.default.join(fileDirectory, 'metadata.json');
        if (await exists_1.exists({ path: fileDirectory })) {
            throw new errors.FileAlreadyExists();
        }
        await fs_1.default.promises.mkdir(fileDirectory, { recursive: true });
        const targetStream = fs_1.default.createWriteStream(fileData);
        let contentLength = 0;
        stream.on('data', (data) => {
            contentLength += data.length;
        });
        await pipeline(stream, targetStream);
        const metadata = {
            id,
            name,
            contentType,
            contentLength
        };
        await fs_1.default.promises.writeFile(fileMetadata, JSON.stringify(metadata), 'utf8');
        return metadata;
    }
    async getFile({ id }) {
        const fileDirectory = path_1.default.join(this.directory, id);
        const fileData = path_1.default.join(fileDirectory, 'data');
        if (!await exists_1.exists({ path: fileDirectory })) {
            throw new errors.FileNotFound();
        }
        const stream = fs_1.default.createReadStream(fileData);
        return stream;
    }
    async getMetadata({ id }) {
        const fileDirectory = path_1.default.join(this.directory, id);
        const fileMetadata = path_1.default.join(fileDirectory, 'metadata.json');
        if (!await exists_1.exists({ path: fileDirectory })) {
            throw new errors.FileNotFound();
        }
        const rawMetadata = await fs_1.default.promises.readFile(fileMetadata, 'utf8');
        const metadata = JSON.parse(rawMetadata);
        return metadata;
    }
    async removeFile({ id }) {
        const fileDirectory = path_1.default.join(this.directory, id);
        if (!await exists_1.exists({ path: fileDirectory })) {
            throw new errors.FileNotFound();
        }
        await fs_1.default.promises.rmdir(fileDirectory, { recursive: true });
    }
    // eslint-disable-next-line class-methods-use-this
    async setup() {
        await fs_1.default.promises.mkdir(this.directory, { recursive: true });
    }
    // eslint-disable-next-line class-methods-use-this
    async destroy() {
        // There is nothing to do here.
    }
}
exports.FileSystemFileStore = FileSystemFileStore;
//# sourceMappingURL=FileSystemFileStore.js.map