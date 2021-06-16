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
suite('setup store consumer-progress mongodb', function () {
    this.timeout(30000);
    test(`sets up a mongodb for the consumer progress store.`, async () => {
        const { connectionString } = connectionOptions_1.connectionOptions.mongoDb;
        const collectionNameProgress = uuid_1.v4();
        const setupMongoDbConsumerProgressStoreCommand = `node ${cliPath} --verbose setup store consumer-progress mongodb --connection-string ${connectionString} --collection-name-progress ${collectionNameProgress}`;
        const { stdout } = shelljs_1.default.exec(setupMongoDbConsumerProgressStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the MongoDB consumer progress store.');
        const client = await retry_ignore_abort_1.retry(async () => await mongodb_1.MongoClient.connect(connectionString, 
        // eslint-disable-next-line id-length
        { w: 1, useNewUrlParser: true, useUnifiedTopology: true }));
        const { pathname } = new url_1.URL(connectionString);
        const database = pathname.slice(1);
        const db = client.db(database);
        const progressCollection = db.collection(collectionNameProgress);
        assertthat_1.assert.that(await progressCollection.indexExists(`${collectionNameProgress}_consumerId_aggregateId`)).
            is.true();
    });
});
//# sourceMappingURL=mongodbTests.js.map