import { assert } from 'assertthat';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import shell from 'shelljs';
import { v4 } from 'uuid';
import { Pool, PoolClient } from 'pg';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store domain-event postgres', function (): void {
  this.timeout(30_000);

  test(`sets up a postgres database for a domain event store.`, async (): Promise<void> => {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.postgres;

    const tableNameDomainEvents = v4();
    const tableNameSnapshots = v4();

    const setupPostgresDomainEventStoreCommand = `node ${cliPath} --verbose setup store domain-event postgres --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-domain-events ${tableNameDomainEvents} --table-name-snapshots ${tableNameSnapshots}`;
    const { stdout } = shell.exec(setupPostgresDomainEventStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the PostgreSQL domain event store.');

    const pool = new Pool({
      host: hostName,
      port,
      user: userName,
      password,
      database
    });
    const connection = await retry(async (): Promise<PoolClient> => await pool.connect());

    let checkTableResult = await connection.query({
      name: 'check table domain events',
      text: `SELECT to_regclass('${tableNameDomainEvents}');`
    });

    assert.that(checkTableResult.rows[0].to_regclass).is.not.null();

    checkTableResult = await connection.query({
      name: 'check table snapshots',
      text: `SELECT to_regclass('${tableNameSnapshots}');`
    });

    assert.that(checkTableResult.rows[0].to_regclass).is.not.null();
  });
});
