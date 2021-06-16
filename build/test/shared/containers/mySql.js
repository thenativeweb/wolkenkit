"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mySql = void 0;
const buntstift_1 = require("buntstift");
const connectionOptions_1 = require("./connectionOptions");
const common_tags_1 = require("common-tags");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const retryOptions_1 = require("./retryOptions");
const shelljs_1 = __importDefault(require("shelljs"));
const mysql_1 = require("mysql");
const mySql = {
    async start() {
        const { hostName, port, userName, password, database } = connectionOptions_1.connectionOptions.mySql;
        shelljs_1.default.exec(common_tags_1.oneLine `
      docker run
        -d
        -p ${port}:3306
        -e MYSQL_ROOT_PASSWORD=${password}
        -e MYSQL_USER=${userName}
        -e MYSQL_PASSWORD=${password}
        -e MYSQL_DATABASE=${database}
        --name test-mysql
        thenativeweb/wolkenkit-mysql:latest
        --bind-address=0.0.0.0
    `);
        const pool = mysql_1.createPool({
            host: hostName,
            port,
            user: userName,
            password,
            database,
            connectTimeout: 0
        });
        try {
            await retry_ignore_abort_1.retry(async () => {
                const connection = await new Promise((resolve, reject) => {
                    pool.getConnection((err, poolConnection) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(poolConnection);
                    });
                });
                connection.release();
            }, retryOptions_1.retryOptions);
        }
        catch (ex) {
            buntstift_1.buntstift.info(ex.message);
            buntstift_1.buntstift.error('Failed to connect to MySQL.');
            throw ex;
        }
        await new Promise((resolve, reject) => {
            pool.end((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    },
    async stop() {
        shelljs_1.default.exec([
            'docker kill test-mysql',
            'docker rm -v test-mysql'
        ].join(';'));
    }
};
exports.mySql = mySql;
//# sourceMappingURL=mySql.js.map