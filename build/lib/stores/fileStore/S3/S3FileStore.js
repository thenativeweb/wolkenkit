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
exports.S3FileStore = void 0;
const minio_1 = require("minio");
const stream_to_string_1 = __importDefault(require("stream-to-string"));
const errors = __importStar(require("../../../common/errors"));
class S3FileStore {
    constructor({ client, region, bucketName }) {
        this.client = client;
        this.bucketName = bucketName;
        this.region = region;
    }
    static async create({ hostName = 's3.amazonaws.com', port = 443, encryptConnection = false, accessKey, secretKey, region = 'eu-central-1a', bucketName }) {
        const client = new minio_1.Client({
            endPoint: hostName,
            port,
            accessKey,
            secretKey,
            region,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            useSSL: encryptConnection
        });
        return new S3FileStore({ client, region, bucketName });
    }
    async ensureBucket() {
        try {
            await this.client.makeBucket(this.bucketName, this.region);
        }
        catch (ex) {
            // S3 differs between a bucket that already exists and is owned by someone
            // else, and a bucket that already exists and is owned by you. If a bucket
            // already exists and is owned by someone else, you get a BucketAlreadyExists
            // error. Since this is actually an error, we don't ignore it. If a bucket
            // already exists and belongs to you, everything is fine, and we can skip
            // this error.
            if (ex.code !== 'BucketAlreadyOwnedByYou') {
                throw ex;
            }
        }
    }
    async addFile({ id, name, contentType, stream }) {
        let statsData, statsMetadata;
        try {
            statsData = await this.client.statObject(this.bucketName, `${id}/data`);
            statsMetadata = await this.client.statObject(this.bucketName, `${id}/metadata.json`);
        }
        catch (ex) {
            if (ex.code !== 'NotFound') {
                throw ex;
            }
            // Intentionally left blank.
        }
        if (statsData !== null && statsData !== void 0 ? statsData : statsMetadata) {
            throw new errors.FileAlreadyExists();
        }
        let contentLength = 0;
        stream.on('data', (data) => {
            contentLength += data.length;
        });
        await this.client.putObject(this.bucketName, `${id}/data`, stream);
        const metadata = {
            id,
            name,
            contentType,
            contentLength
        };
        await this.client.putObject(this.bucketName, `${id}/metadata.json`, JSON.stringify(metadata));
        return metadata;
    }
    async getFile({ id }) {
        try {
            await this.client.statObject(this.bucketName, `${id}/data`);
            await this.client.statObject(this.bucketName, `${id}/metadata.json`);
        }
        catch (ex) {
            if (ex.code === 'NotFound') {
                throw new errors.FileNotFound();
            }
            throw ex;
        }
        const stream = await this.client.getObject(this.bucketName, `${id}/data`);
        return stream;
    }
    async getMetadata({ id }) {
        try {
            await this.client.statObject(this.bucketName, `${id}/data`);
            await this.client.statObject(this.bucketName, `${id}/metadata.json`);
        }
        catch (ex) {
            if (ex.code === 'NotFound') {
                throw new errors.FileNotFound();
            }
            throw ex;
        }
        const metadataStream = await this.client.getObject(this.bucketName, `${id}/metadata.json`);
        const rawMetadata = await stream_to_string_1.default(metadataStream);
        const metadata = JSON.parse(rawMetadata);
        return metadata;
    }
    async removeFile({ id }) {
        const files = [`${id}/data`, `${id}/metadata.json`];
        let notFoundErrors = 0;
        for (const file of files) {
            try {
                await this.client.statObject(this.bucketName, file);
                await this.client.removeObject(this.bucketName, file);
            }
            catch (ex) {
                if (ex.code !== 'NotFound') {
                    throw ex;
                }
                notFoundErrors += 1;
            }
        }
        if (notFoundErrors === files.length) {
            throw new errors.FileNotFound();
        }
    }
    async setup() {
        await this.ensureBucket();
    }
    // eslint-disable-next-line class-methods-use-this
    async destroy() {
        // There is nothing to do here.
    }
}
exports.S3FileStore = S3FileStore;
//# sourceMappingURL=S3FileStore.js.map