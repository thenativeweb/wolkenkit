import { assert } from 'assertthat';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import shell from 'shelljs';
import { v4 } from 'uuid';
import { Pool, PoolClient } from 'pg';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store priority-queue postgres', function (): void {
  this.timeout(30_000);

  test(`sets up a postgres database for a priority queue store.`, async (): Promise<void> => {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.postgres;

    const tableNameItems = v4();
    const tableNamePriorityQueue = v4();

    const setupPostgresPriorityQueueStoreCommand = `node ${cliPath} --verbose setup store priority-queue postgres --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-items ${tableNameItems} --table-name-priority-queue ${tableNamePriorityQueue}`;
    const { stdout } = shell.exec(setupPostgresPriorityQueueStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up postgres priority queue store.');

    const pool = new Pool({
      host: hostName,
      port,
      user: userName,
      password,
      database
    });
    const connection = await retry(async (): Promise<PoolClient> => await pool.connect());

    let checkTableResult = await connection.query({
      name: 'check table items',
      text: `SELECT to_regclass('${tableNameItems}');`
    });

    assert.that(checkTableResult.rows[0].to_regclass).is.not.null();

    checkTableResult = await connection.query({
      name: 'check table priority queue',
      text: `SELECT to_regclass('${tableNamePriorityQueue}');`
    });

    assert.that(checkTableResult.rows[0].to_regclass).is.not.null();
  });
});
