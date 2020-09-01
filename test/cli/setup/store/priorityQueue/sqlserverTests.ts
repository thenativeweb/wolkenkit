import { assert } from 'assertthat';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import { ConnectionPool } from 'mssql';
import path from 'path';
import shell from 'shelljs';
import { v4 } from 'uuid';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store priority-queue sqlserver', function (): void {
  this.timeout(30_000);

  test(`sets up a sqlserver database for a priority queue store.`, async (): Promise<void> => {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.sqlServer;

    const tableNameItems = v4();
    const tableNamePriorityQueue = v4();

    const setupSqlServerDomainEventStoreCommand = `node ${cliPath} --verbose setup store priority-queue sqlserver --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-items ${tableNameItems} --table-name-priority-queue ${tableNamePriorityQueue}`;
    const { stdout } = shell.exec(setupSqlServerDomainEventStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up sqlserver priority queue store.');

    const pool = new ConnectionPool({
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

    let result = await pool.query(`SELECT [name] FROM sys.tables WHERE [name] = '${tableNameItems}';`);

    assert.that(result.recordset.length).is.equalTo(1);

    result = await pool.query(`SELECT [name] FROM sys.tables WHERE [name] = '${tableNamePriorityQueue}';`);

    assert.that(result.recordset.length).is.equalTo(1);
  });
});
