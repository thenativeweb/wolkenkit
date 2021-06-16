"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoDb = void 0;
const buntstift_1 = require("buntstift");
const connectionOptions_1 = require("./connectionOptions");
const mongodb_1 = require("mongodb");
const common_tags_1 = require("common-tags");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const retryOptions_1 = require("./retryOptions");
const shelljs_1 = __importDefault(require("shelljs"));
const url_1 = require("url");
const mongoDb = {
    async start() {
        const { connectionString } = connectionOptions_1.connectionOptions.mongoDb;
        const { username, password, hostname, pathname, port } = new url_1.URL(connectionString);
        const database = pathname.slice(1);
        shelljs_1.default.exec(common_tags_1.oneLine `
      docker run
        -d
        -p 27017:27017
        -e MONGODB_ROOT_PASSWORD=${password}
        -e MONGODB_USERNAME=${username}
        -e MONGODB_PASSWORD=${password}
        -e MONGODB_DATABASE=${database}
        -e MONGODB_REPLICA_SET_MODE=primary
        -e MONGODB_REPLICA_SET_NAME=rs0
        -e MONGODB_REPLICA_SET_KEY=secret
        --name test-mongodb
        thenativeweb/wolkenkit-mongodb:latest
    `);
        const url = `mongodb://${username}:${password}@${hostname}:${port}/${database}`;
        try {
            await retry_ignore_abort_1.retry(async () => {
                /* eslint-disable id-length */
                const client = await mongodb_1.MongoClient.connect(url, { w: 1, useNewUrlParser: true, useUnifiedTopology: true });
                /* eslint-enable id-length */
                await client.close();
            }, retryOptions_1.retryOptions);
        }
        catch (ex) {
            buntstift_1.buntstift.info(ex.message);
            buntstift_1.buntstift.error('Failed to connect to MongoDB.');
            throw ex;
        }
    },
    async stop() {
        shelljs_1.default.exec([
            'docker kill test-mongodb',
            'docker rm -v test-mongodb'
        ].join(';'));
    }
};
exports.mongoDb = mongoDb;
//# sourceMappingURL=mongoDb.js.map