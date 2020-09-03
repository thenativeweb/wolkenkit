import { assert } from 'assertthat';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import { ConnectionPool } from 'mssql';
import path from 'path';
import shell from 'shelljs';
import { v4 } from 'uuid';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store consumer-progress sqlserver', function (): void {
  this.timeout(30_000);

  test(`sets up a sqlserver database for a consumer progress store.`, async (): Promise<void> => {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.sqlServer;

    const tableNameProgress = v4();

    const setupSqlServerConsumerProgressStoreCommand = `node ${cliPath} --verbose setup store consumer-progress sqlserver --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-progress ${tableNameProgress}`;
    const { stdout } = shell.exec(setupSqlServerConsumerProgressStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the SQL Server consumer progress store.');

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

    const result = await pool.query(`SELECT [name] FROM sys.tables WHERE [name] = '${tableNameProgress}';`);

    assert.that(result.recordset.length).is.equalTo(1);
  });
});
