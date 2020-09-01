import { assert } from 'assertthat';
import { connectionOptions } from '../../../../shared/containers/connectionOptions';
import { MongoClient } from 'mongodb';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import shell from 'shelljs';
import { URL } from 'url';
import { v4 } from 'uuid';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store lock mongodb', function (): void {
  this.timeout(30_000);

  test(`sets up a mongodb for the lock store.`, async (): Promise<void> => {
    const {
      connectionString
    } = connectionOptions.mongoDb;

    const collectionNameLocks = v4();

    const setupMongoDbLockStoreCommand = `node ${cliPath} --verbose setup store lock mongodb --connection-string ${connectionString} --collection-name-locks ${collectionNameLocks}`;
    const { stdout } = shell.exec(setupMongoDbLockStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up mongodb lock store.');

    const client = await retry(async (): Promise<MongoClient> => await MongoClient.connect(
      connectionString,
      // eslint-disable-next-line id-length
      { w: 1, useNewUrlParser: true, useUnifiedTopology: true }
    ));

    const { pathname } = new URL(connectionString);
    const database = pathname.slice(1);

    const db = client.db(database);
    const locksCollection = db.collection(collectionNameLocks);

    assert.that(await locksCollection.indexExists(`${collectionNameLocks}_value`)).
      is.true();
  });
});
