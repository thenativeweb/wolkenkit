"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const buntstift_1 = require("buntstift");
const connectionOptions_1 = require("./connectionOptions");
const common_tags_1 = require("common-tags");
const ioredis_1 = __importDefault(require("ioredis"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const retryOptions_1 = require("./retryOptions");
const shelljs_1 = __importDefault(require("shelljs"));
const redis = {
    async start() {
        const { hostName, port, password, database } = connectionOptions_1.connectionOptions.redis;
        shelljs_1.default.exec(common_tags_1.oneLine `
      docker run
        -d
        -p ${port}:6379
        --name test-redis
        thenativeweb/wolkenkit-redis:latest
        redis-server --requirepass ${password}
    `);
        try {
            await retry_ignore_abort_1.retry(async () => {
                const client = new ioredis_1.default({
                    host: hostName,
                    port,
                    password,
                    db: database
                });
                await client.ping();
                await client.quit();
            }, retryOptions_1.retryOptions);
        }
        catch (ex) {
            buntstift_1.buntstift.info(ex.message);
            buntstift_1.buntstift.error('Failed to connect to Redis.');
            throw ex;
        }
    },
    async stop() {
        shelljs_1.default.exec([
            'docker kill test-redis',
            'docker rm -v test-redis'
        ].join(';'));
    }
};
exports.redis = redis;
//# sourceMappingURL=redis.js.map