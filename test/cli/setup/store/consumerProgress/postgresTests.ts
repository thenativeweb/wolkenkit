import { assert } from 'assertthat';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import shell from 'shelljs';
import { v4 } from 'uuid';
import { Pool, PoolClient } from 'pg';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store consumer-progress postgres', function (): void {
  this.timeout(30_000);

  test(`sets up a postgres database for a consumer progress store.`, async (): Promise<void> => {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.postgres;

    const tableNameProgress = v4();

    const setupPostgresConsumerProgressStoreCommand = `node ${cliPath} --verbose setup store consumer-progress postgres --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-progress ${tableNameProgress}`;
    const { stdout } = shell.exec(setupPostgresConsumerProgressStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up postgres consumer progress store.');

    const pool = new Pool({
      host: hostName,
      port,
      user: userName,
      password,
      database
    });
    const connection = await retry(async (): Promise<PoolClient> => await pool.connect());

    const checkTableResult = await connection.query({
      name: 'check table',
      text: `SELECT to_regclass('${tableNameProgress}');`
    });

    assert.that(checkTableResult.rows[0].to_regclass).is.not.null();
  });
});
