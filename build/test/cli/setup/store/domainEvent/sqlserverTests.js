"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const connectionOptions_1 = require("../../../../shared/containers/connectionOptions");
const mssql_1 = require("mssql");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const uuid_1 = require("uuid");
const rootPath = path_1.default.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('setup store domain-event sqlserver', function () {
    this.timeout(30000);
    test(`sets up a sqlserver database for a domain event store.`, async () => {
        const { hostName, port, userName, password, database } = connectionOptions_1.connectionOptions.sqlServer;
        const tableNameDomainEvents = uuid_1.v4();
        const tableNameSnapshots = uuid_1.v4();
        const setupSqlServerDomainEventStoreCommand = `node ${cliPath} --verbose setup store domain-event sqlserver --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-domain-events ${tableNameDomainEvents} --table-name-snapshots ${tableNameSnapshots}`;
        const { stdout } = shelljs_1.default.exec(setupSqlServerDomainEventStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the SQL Server domain event store.');
        const pool = new mssql_1.ConnectionPool({
            server: hostName,
            port,
            user: userName,
            password,
            database,
            options: {
                enableArithAbort: true,
                encrypt: false,
                trustServerCertificate: false
            }
        });
        await pool.connect();
        let result = await pool.query(`SELECT [name] FROM sys.tables WHERE [name] = '${tableNameDomainEvents}';`);
        assertthat_1.assert.that(result.recordset.length).is.equalTo(1);
        result = await pool.query(`SELECT [name] FROM sys.tables WHERE [name] = '${tableNameSnapshots}';`);
        assertthat_1.assert.that(result.recordset.length).is.equalTo(1);
    });
});
//# sourceMappingURL=sqlserverTests.js.map