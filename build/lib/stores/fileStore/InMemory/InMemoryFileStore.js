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
exports.InMemoryFileStore = void 0;
const stream_1 = require("stream");
const errors = __importStar(require("../../../common/errors"));
class InMemoryFileStore {
    constructor() {
        this.files = {};
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async create(options) {
        return new InMemoryFileStore();
    }
    async addFile({ id, name, contentType, stream }) {
        if (this.files[id]) {
            throw new errors.FileAlreadyExists();
        }
        const chunks = [];
        let contentLength = 0;
        for await (const chunk of stream) {
            chunks.push(chunk);
            contentLength += chunk.length;
        }
        const data = Buffer.concat(chunks), metadata = { id, name, contentType, contentLength };
        this.files[id] = {
            data,
            metadata
        };
        return metadata;
    }
    async getFile({ id }) {
        const file = this.files[id];
        if (!file) {
            throw new errors.FileNotFound();
        }
        const stream = stream_1.Readable.from(file.data);
        return stream;
    }
    async getMetadata({ id }) {
        const file = this.files[id];
        if (!file) {
            throw new errors.FileNotFound();
        }
        return file.metadata;
    }
    async removeFile({ id }) {
        const file = this.files[id];
        if (!file) {
            throw new errors.FileNotFound();
        }
        Reflect.deleteProperty(this.files, id);
    }
    // eslint-disable-next-line class-methods-use-this
    async setup() {
        // There is nothing to do here.
    }
    // eslint-disable-next-line class-methods-use-this
    async destroy() {
        // There is nothing to do here.
    }
}
exports.InMemoryFileStore = InMemoryFileStore;
//# sourceMappingURL=InMemoryFileStore.js.map