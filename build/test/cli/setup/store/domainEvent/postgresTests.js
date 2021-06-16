"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const connectionOptions_1 = require("../../../../shared/containers/connectionOptions");
const path_1 = __importDefault(require("path"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const shelljs_1 = __importDefault(require("shelljs"));
const uuid_1 = require("uuid");
const pg_1 = require("pg");
const rootPath = path_1.default.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('setup store domain-event postgres', function () {
    this.timeout(30000);
    test(`sets up a postgres database for a domain event store.`, async () => {
        const { hostName, port, userName, password, database } = connectionOptions_1.connectionOptions.postgres;
        const tableNameDomainEvents = uuid_1.v4();
        const tableNameSnapshots = uuid_1.v4();
        const setupPostgresDomainEventStoreCommand = `node ${cliPath} --verbose setup store domain-event postgres --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-domain-events ${tableNameDomainEvents} --table-name-snapshots ${tableNameSnapshots}`;
        const { stdout } = shelljs_1.default.exec(setupPostgresDomainEventStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the PostgreSQL domain event store.');
        const pool = new pg_1.Pool({
            host: hostName,
            port,
            user: userName,
            password,
            database
        });
        const connection = await retry_ignore_abort_1.retry(async () => await pool.connect());
        let checkTableResult = await connection.query({
            name: 'check table domain events',
            text: `SELECT to_regclass('${tableNameDomainEvents}');`
        });
        assertthat_1.assert.that(checkTableResult.rows[0].to_regclass).is.not.null();
        checkTableResult = await connection.query({
            name: 'check table snapshots',
            text: `SELECT to_regclass('${tableNameSnapshots}');`
        });
        assertthat_1.assert.that(checkTableResult.rows[0].to_regclass).is.not.null();
    });
});
//# sourceMappingURL=postgresTests.js.map