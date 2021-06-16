"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockMongoDbCommand = void 0;
const buntstift_1 = require("buntstift");
const createLockStore_1 = require("../../../../../stores/lockStore/createLockStore");
const lockMongoDbCommand = function () {
    return {
        name: 'mongodb',
        description: 'Set up a MongoDB lock store.',
        optionDefinitions: [
            {
                name: 'connection-string',
                type: 'string',
                isRequired: true
            },
            {
                name: 'collection-name-locks',
                type: 'string',
                defaultValue: 'locks'
            }
        ],
        async handle({ options: { 'connection-string': connectionString, 'collection-name-locks': collectionNameLocks, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'MongoDb',
                connectionString,
                collectionNames: {
                    locks: collectionNameLocks
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the MongoDB lock store...');
                const store = await createLockStore_1.createLockStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the MongoDB lock store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the MongoDB lock store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.lockMongoDbCommand = lockMongoDbCommand;
//# sourceMappingURL=lockMongoDbCommand.js.map