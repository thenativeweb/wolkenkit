"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgres = void 0;
const buntstift_1 = require("buntstift");
const connectionOptions_1 = require("./connectionOptions");
const common_tags_1 = require("common-tags");
const pg_1 = require("pg");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const retryOptions_1 = require("./retryOptions");
const shelljs_1 = __importDefault(require("shelljs"));
const postgres = {
    async start() {
        const { hostName, port, userName, password, database } = connectionOptions_1.connectionOptions.postgres;
        shelljs_1.default.exec(common_tags_1.oneLine `
      docker run
        -d
        -p ${port}:5432
        -e POSTGRES_DB=${database}
        -e POSTGRES_USER=${userName}
        -e POSTGRES_PASSWORD=${password}
        --name test-postgres
        thenativeweb/wolkenkit-postgres:latest
    `);
        const pool = new pg_1.Pool({
            host: hostName,
            port,
            user: userName,
            password,
            database
        });
        try {
            await retry_ignore_abort_1.retry(async () => {
                const connection = await pool.connect();
                connection.release();
            }, retryOptions_1.retryOptions);
        }
        catch (ex) {
            buntstift_1.buntstift.info(ex.message);
            buntstift_1.buntstift.error('Failed to connect to Postgres.');
            throw ex;
        }
        await pool.end();
    },
    async stop() {
        shelljs_1.default.exec([
            'docker kill test-postgres',
            'docker rm -v test-postgres'
        ].join(';'));
    }
};
exports.postgres = postgres;
//# sourceMappingURL=postgres.js.map