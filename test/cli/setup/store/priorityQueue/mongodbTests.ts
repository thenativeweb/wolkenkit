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

suite('setup store priority-queue mongodb', function (): void {
  this.timeout(30_000);

  test(`sets up a mongodb for the priority queue store.`, async (): Promise<void> => {
    const {
      connectionString
    } = connectionOptions.mongoDb;

    const collectionNameQueues = v4();

    const setupMongoDbPriorityQueueStoreCommand = `node ${cliPath} --verbose setup store priority-queue mongodb --connection-string ${connectionString} --collection-name-queues ${collectionNameQueues}`;
    const { stdout } = shell.exec(setupMongoDbPriorityQueueStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the MongoDB priority queue store.');

    const client = await retry(async (): Promise<MongoClient> => await MongoClient.connect(
      connectionString,
      // eslint-disable-next-line id-length
      { w: 1, useNewUrlParser: true, useUnifiedTopology: true }
    ));

    const { pathname } = new URL(connectionString);
    const database = pathname.slice(1);

    const db = client.db(database);
    const queuesCollection = db.collection(collectionNameQueues);

    assert.that(await queuesCollection.indexExists(`${collectionNameQueues}_discriminator`)).
      is.true();
    assert.that(await queuesCollection.indexExists(`${collectionNameQueues}_indexInPriorityQueue`)).
      is.true();
  });
});
