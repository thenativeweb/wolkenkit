import { assert } from 'assertthat';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import { ConnectionPool } from 'mssql';
import path from 'path';
import shell from 'shelljs';
import { v4 } from 'uuid';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store lock sqlserver', function (): void {
  this.timeout(30_000);

  test(`sets up a sqlserver database for a lock store.`, async (): Promise<void> => {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.sqlServer;

    const tableNameLock = v4();

    const setupSqlServerLockStoreCommand = `node ${cliPath} --verbose setup store lock sqlserver --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-locks ${tableNameLock}`;
    const { stdout } = shell.exec(setupSqlServerLockStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the SQL Server lock store.');

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

    const result = await pool.query(`SELECT [name] FROM sys.tables WHERE [name] = '${tableNameLock}';`);

    assert.that(result.recordset.length).is.equalTo(1);
  });
});
