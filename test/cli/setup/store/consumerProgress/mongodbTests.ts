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

suite('setup store consumer-progress mongodb', function (): void {
  this.timeout(30_000);

  test(`sets up a mongodb for the consumer progress store.`, async (): Promise<void> => {
    const {
      connectionString
    } = connectionOptions.mongoDb;

    const collectionNameProgress = v4();

    const setupMongoDbConsumerProgressStoreCommand = `node ${cliPath} --verbose setup store consumer-progress mongodb --connection-string ${connectionString} --collection-name-progress ${collectionNameProgress}`;
    const { stdout } = shell.exec(setupMongoDbConsumerProgressStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the MongoDB consumer progress store.');

    const client = await retry(async (): Promise<MongoClient> => await MongoClient.connect(
      connectionString,
      // eslint-disable-next-line id-length
      { w: 1, useNewUrlParser: true, useUnifiedTopology: true }
    ));

    const { pathname } = new URL(connectionString);
    const database = pathname.slice(1);

    const db = client.db(database);
    const progressCollection = db.collection(collectionNameProgress);

    assert.that(await progressCollection.indexExists(`${collectionNameProgress}_consumerId_aggregateId`)).
      is.true();
  });
});
