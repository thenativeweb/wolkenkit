"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlServer = void 0;
const buntstift_1 = require("buntstift");
const connectionOptions_1 = require("./connectionOptions");
const mssql_1 = require("mssql");
const common_tags_1 = require("common-tags");
const retry_ignore_abort_1 = require("retry-ignore-abort");
const retryOptions_1 = require("./retryOptions");
const shelljs_1 = __importDefault(require("shelljs"));
const createDatabase = async function ({ pool, database }) {
    await pool.query(`
    IF NOT EXISTS(SELECT * from sys.databases WHERE name = '${database}')
      BEGIN
        CREATE DATABASE ${database};
      END;
  `);
};
const sqlServer = {
    async start() {
        const { hostName, port, userName, password, database } = connectionOptions_1.connectionOptions.sqlServer;
        shelljs_1.default.exec(common_tags_1.oneLine `
      docker run
        -d
        -p ${port}:1433
        -e ACCEPT_EULA=Y
        -e SA_PASSWORD=${password}
        --name test-sqlserver
        thenativeweb/wolkenkit-sqlserver:latest
    `);
        try {
            await retry_ignore_abort_1.retry(async () => {
                const pool = new mssql_1.ConnectionPool({
                    server: hostName,
                    port,
                    user: userName,
                    password,
                    database: 'master',
                    options: {
                        enableArithAbort: true,
                        encrypt: false,
                        trustServerCertificate: false
                    }
                });
                await pool.connect();
                await createDatabase({ pool, database });
                await pool.close();
            }, retryOptions_1.retryOptions);
        }
        catch (ex) {
            buntstift_1.buntstift.info(ex.message);
            buntstift_1.buntstift.error('Failed to connect to SQL Server.');
            throw ex;
        }
    },
    async stop() {
        shelljs_1.default.exec([
            'docker kill test-sqlserver',
            'docker rm -v test-sqlserver'
        ].join(';'));
    }
};
exports.sqlServer = sqlServer;
//# sourceMappingURL=sqlServer.js.map