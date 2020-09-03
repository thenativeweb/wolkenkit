import { assert } from 'assertthat';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import { runQuery } from '../../../../../lib/stores/utils/mySql/runQuery';
import shell from 'shelljs';
import { v4 } from 'uuid';
import { createPool, MysqlError, PoolConnection } from 'mysql';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store consumer-progress mysql', function (): void {
  this.timeout(30_000);

  test(`sets up a mysql database for a consumer progress store.`, async (): Promise<void> => {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.mySql;

    const tableNameProgress = v4();

    const setupMySqlConsumerProgressStoreCommand = `node ${cliPath} --verbose setup store consumer-progress mysql --host-name ${hostName} --port ${port} --user-name ${userName} --password ${password} --database ${database} --table-name-progress ${tableNameProgress}`;
    const { stdout } = shell.exec(setupMySqlConsumerProgressStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the MySQL consumer progress store.');

    const pool = createPool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      connectTimeout: 0,
      multipleStatements: true
    });
    const connection = await retry(async (): Promise<PoolConnection> => new Promise((resolve, reject): void => {
      pool.getConnection((err: MysqlError | null, poolConnection): void => {
        if (err) {
          return reject(err);
        }

        resolve(poolConnection);
      });
    }));

    const checkFunctionsResult = await runQuery({
      connection,
      query: `
        SELECT routine_name
          FROM information_schema.routines
          WHERE
                routine_type="FUNCTION"
            AND routine_schema="${database}"
        ;`
    });

    assert.that(checkFunctionsResult[0][0].routine_name).is.equalTo('UuidFromBin');
    assert.that(checkFunctionsResult[0][1].routine_name).is.equalTo('UuidToBin');

    const checkTableResult = await runQuery({
      connection,
      query: `
        SELECT *
          FROM information_schema.tables
          WHERE
                  table_schema = '${database}'
              AND table_name = '${tableNameProgress}'
          LIMIT 1;`
    });

    assert.that(checkTableResult[0].length).is.equalTo(1);
  });
});
