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

suite('setup store domain-event mongodb', function (): void {
  this.timeout(30_000);

  test(`sets up a mongodb for the domain event store.`, async (): Promise<void> => {
    const {
      connectionString
    } = connectionOptions.mongoDb;

    const collectionNameDomainEvents = v4(),
          collectionNameSnapshots = v4();

    const setupMongoDbDomainEventStoreCommand = `node ${cliPath} --verbose setup store domain-event mongodb --connection-string ${connectionString} --collection-name-domain-events ${collectionNameDomainEvents} --collection-name-snapshots ${collectionNameSnapshots}`;
    const { stdout } = shell.exec(setupMongoDbDomainEventStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the MongoDB domain event store.');

    const client = await retry(async (): Promise<MongoClient> => await MongoClient.connect(
      connectionString,
      // eslint-disable-next-line id-length
      { w: 1, useNewUrlParser: true, useUnifiedTopology: true }
    ));

    const { pathname } = new URL(connectionString);
    const database = pathname.slice(1);

    const db = client.db(database);
    const domainEventCollection = db.collection(collectionNameDomainEvents);
    const snapshotCollection = db.collection(collectionNameSnapshots);

    assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_aggregateId`)).
      is.true();
    assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_aggregateId_revision`)).
      is.true();
    assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_causationId`)).
      is.true();
    assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_correlationId`)).
      is.true();
    assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_timestamp`)).
      is.true();
    assert.that(await snapshotCollection.indexExists(`${collectionNameSnapshots}_aggregateId`)).
      is.true();
  });
});
