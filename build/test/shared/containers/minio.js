"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.minio = void 0;
const buntstift_1 = require("buntstift");
const minio_1 = require("minio");
const connectionOptions_1 = require("./connectionOptions");
const common_tags_1 = require("common-tags");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const retryOptions_1 = require("./retryOptions");
const shelljs_1 = __importDefault(require("shelljs"));
const minio = {
    async start() {
        const { hostName, port, accessKey, secretKey, encryptConnection } = connectionOptions_1.connectionOptions.minio;
        shelljs_1.default.exec(common_tags_1.oneLine `
      docker run
        -d
        -p ${port}:9000
        -e "MINIO_ACCESS_KEY=${accessKey}"
        -e "MINIO_SECRET_KEY=${secretKey}"
        --name test-minio
        thenativeweb/wolkenkit-minio:latest
        server
        /data
    `);
        try {
            await retry_ignore_abort_1.retry(async () => {
                const client = new minio_1.Client({
                    endPoint: hostName,
                    port,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    useSSL: encryptConnection,
                    accessKey,
                    secretKey
                });
                await client.listBuckets();
            }, retryOptions_1.retryOptions);
        }
        catch (ex) {
            buntstift_1.buntstift.info(ex.message);
            buntstift_1.buntstift.error('Failed to connect to Minio.');
            throw ex;
        }
    },
    async stop() {
        shelljs_1.default.exec([
            'docker kill test-minio',
            'docker rm -v test-minio'
        ].join(';'));
    }
};
exports.minio = minio;
//# sourceMappingURL=minio.js.map