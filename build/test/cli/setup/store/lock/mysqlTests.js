"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const connectionOptions_1 = require("../../../../shared/containers/connectionOptions");
const path_1 = __importDefault(require("path"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const runQuery_1 = require("../../../../../lib/stores/utils/mySql/runQuery");
const shelljs_1 = __importDefault(require("shelljs"));
const uuid_1 = require("uuid");
const mysql_1 = require("mysql");
const rootPath = path_1.default.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('setup store lock mysql', function () {
    this.timeout(30000);
    test(`sets up a mysql database for a lock store.`, async () => {
        const { hostName, port, userName, password, database } = connectionOptions_1.connectionOptions.mySql;
        const tableNameLocks = uuid_1.v4();
        const setupMySqlLockStoreCommand = `node ${cliPath} --verbose setup store lock mysql --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-locks ${tableNameLocks}`;
        const { stdout } = shelljs_1.default.exec(setupMySqlLockStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the MySQL lock store.');
        const pool = mysql_1.createPool({
            host: hostName,
            port,
            user: userName,
            password,
            database,
            connectTimeout: 0,
            multipleStatements: true
        });
        const connection = await retry_ignore_abort_1.retry(async () => new Promise((resolve, reject) => {
            pool.getConnection((err, poolConnection) => {
                if (err) {
                    return reject(err);
                }
                resolve(poolConnection);
            });
        }));
        const checkTableResult = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT *
          FROM information_schema.tables
          WHERE
                  table_schema = '${database}'
              AND table_name = '${tableNameLocks}'
          LIMIT 1;`
        });
        assertthat_1.assert.that(checkTableResult[0].length).is.equalTo(1);
    });
});
//# sourceMappingURL=mysqlTests.js.map