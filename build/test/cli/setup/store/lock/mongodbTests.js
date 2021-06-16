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
suite('setup store lock mongodb', function () {
    this.timeout(30000);
    test(`sets up a mongodb for the lock store.`, async () => {
        const { connectionString } = connectionOptions_1.connectionOptions.mongoDb;
        const collectionNameLocks = uuid_1.v4();
        const setupMongoDbLockStoreCommand = `node ${cliPath} --verbose setup store lock mongodb --connection-string ${connectionString} --collection-name-locks ${collectionNameLocks}`;
        const { stdout } = shelljs_1.default.exec(setupMongoDbLockStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the MongoDB lock store.');
        const client = await retry_ignore_abort_1.retry(async () => await mongodb_1.MongoClient.connect(connectionString, 
        // eslint-disable-next-line id-length
        { w: 1, useNewUrlParser: true, useUnifiedTopology: true }));
        const { pathname } = new url_1.URL(connectionString);
        const database = pathname.slice(1);
        const db = client.db(database);
        const locksCollection = db.collection(collectionNameLocks);
        assertthat_1.assert.that(await locksCollection.indexExists(`${collectionNameLocks}_value`)).
            is.true();
    });
});
//# sourceMappingURL=mongodbTests.js.map