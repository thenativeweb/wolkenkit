"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumerProgressMongoDbCommand = void 0;
const buntstift_1 = require("buntstift");
const createConsumerProgressStore_1 = require("../../../../../stores/consumerProgressStore/createConsumerProgressStore");
const consumerProgressMongoDbCommand = function () {
    return {
        name: 'mongodb',
        description: 'Set up a MongoDB consumer progress store.',
        optionDefinitions: [
            {
                name: 'connection-string',
                type: 'string',
                isRequired: true
            },
            {
                name: 'collection-name-progress',
                type: 'string',
                defaultValue: 'progress'
            }
        ],
        async handle({ options: { 'connection-string': connectionString, 'collection-name-progress': collectionNameProgress, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'MongoDb',
                connectionString,
                collectionNames: {
                    progress: collectionNameProgress
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the MongoDB consumer progress store...');
                const store = await createConsumerProgressStore_1.createConsumerProgressStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the MongoDB consumer progress store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the MongoDB consumer progress store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.consumerProgressMongoDbCommand = consumerProgressMongoDbCommand;
//# sourceMappingURL=consumerProgressMongoDbCommand.js.map