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
suite('setup store priority-queue mysql', function () {
    this.timeout(30000);
    test(`sets up a mysql database for a priority queue store.`, async () => {
        const { hostName, port, userName, password, database } = connectionOptions_1.connectionOptions.mySql;
        const tableNameItems = uuid_1.v4();
        const tableNamePriorityQueue = uuid_1.v4();
        const setupMySqlPriorityQueueStoreCommand = `node ${cliPath} --verbose setup store priority-queue mysql --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-items ${tableNameItems} --table-name-priority-queue ${tableNamePriorityQueue}`;
        const { stdout } = shelljs_1.default.exec(setupMySqlPriorityQueueStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the MySQL priority queue store.');
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
        const checkFunctionsResult = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT routine_name
          FROM information_schema.routines
          WHERE
                routine_type="FUNCTION"
            AND routine_schema="${database}"
        ;`
        });
        assertthat_1.assert.that(checkFunctionsResult[0][0].routine_name).is.equalTo('UuidFromBin');
        assertthat_1.assert.that(checkFunctionsResult[0][1].routine_name).is.equalTo('UuidToBin');
        let checkTableResult = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT *
          FROM information_schema.tables
          WHERE
                  table_schema = '${database}'
              AND table_name = '${tableNameItems}'
          LIMIT 1;`
        });
        assertthat_1.assert.that(checkTableResult[0].length).is.equalTo(1);
        checkTableResult = await runQuery_1.runQuery({
            connection,
            query: `
        SELECT *
          FROM information_schema.tables
          WHERE
                  table_schema = '${database}'
              AND table_name = '${tableNamePriorityQueue}'
          LIMIT 1;`
        });
        assertthat_1.assert.that(checkTableResult[0].length).is.equalTo(1);
    });
});
//# sourceMappingURL=mysqlTests.js.map