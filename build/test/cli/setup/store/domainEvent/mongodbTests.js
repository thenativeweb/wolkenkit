"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const connectionOptions_1 = require("../../../../shared/containers/connectionOptions");
const mongodb_1 = require("mongodb");
const path_1 = __importDefault(require("path"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const shelljs_1 = __importDefault(require("shelljs"));
const url_1 = require("url");
const uuid_1 = require("uuid");
const rootPath = path_1.default.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('setup store domain-event mongodb', function () {
    this.timeout(30000);
    test(`sets up a mongodb for the domain event store.`, async () => {
        const { connectionString } = connectionOptions_1.connectionOptions.mongoDb;
        const collectionNameDomainEvents = uuid_1.v4(), collectionNameSnapshots = uuid_1.v4();
        const setupMongoDbDomainEventStoreCommand = `node ${cliPath} --verbose setup store domain-event mongodb --connection-string ${connectionString} --collection-name-domain-events ${collectionNameDomainEvents} --collection-name-snapshots ${collectionNameSnapshots}`;
        const { stdout } = shelljs_1.default.exec(setupMongoDbDomainEventStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the MongoDB domain event store.');
        const client = await retry_ignore_abort_1.retry(async () => await mongodb_1.MongoClient.connect(connectionString, 
        // eslint-disable-next-line id-length
        { w: 1, useNewUrlParser: true, useUnifiedTopology: true }));
        const { pathname } = new url_1.URL(connectionString);
        const database = pathname.slice(1);
        const db = client.db(database);
        const domainEventCollection = db.collection(collectionNameDomainEvents);
        const snapshotCollection = db.collection(collectionNameSnapshots);
        assertthat_1.assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_aggregateId`)).
            is.true();
        assertthat_1.assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_aggregateId_revision`)).
            is.true();
        assertthat_1.assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_causationId`)).
            is.true();
        assertthat_1.assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_correlationId`)).
            is.true();
        assertthat_1.assert.that(await domainEventCollection.indexExists(`${collectionNameDomainEvents}_timestamp`)).
            is.true();
        assertthat_1.assert.that(await snapshotCollection.indexExists(`${collectionNameSnapshots}_aggregateId`)).
            is.true();
    });
});
//# sourceMappingURL=mongodbTests.js.map