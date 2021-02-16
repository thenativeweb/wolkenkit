import { assert } from 'assertthat';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import path from 'path';
import shell from 'shelljs';
import { v4 } from 'uuid';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store lock redis', function (): void {
  this.timeout(30_000);

  test(`sets up a redis database for a lock store.`, async (): Promise<void> => {
    const {
      hostName,
      port,
      password,
      database
    } = connectionOptions.redis;

    const listNameLocks = v4();

    const setupPostgresLockStoreCommand = `node ${cliPath} --verbose setup store lock redis --host-name ${hostName} --port ${port} --password ${password} --database ${database} --list-name-locks ${listNameLocks}`;
    const { stdout } = shell.exec(setupPostgresLockStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the Redis lock store.');

    // There is nothing to test here, since the redis setup does not prepare anything.
  });
});
