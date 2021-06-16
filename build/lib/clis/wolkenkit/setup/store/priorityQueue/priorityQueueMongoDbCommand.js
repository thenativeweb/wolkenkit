"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priorityQueueMongoDbCommand = void 0;
const buntstift_1 = require("buntstift");
const createPriorityQueueStore_1 = require("../../../../../stores/priorityQueueStore/createPriorityQueueStore");
const priorityQueueMongoDbCommand = function () {
    return {
        name: 'mongodb',
        description: 'Set up a MongoDB priority queue store.',
        optionDefinitions: [
            {
                name: 'connection-string',
                type: 'string',
                isRequired: true
            },
            {
                name: 'collection-name-queues',
                type: 'string',
                defaultValue: 'queues'
            }
        ],
        async handle({ options: { 'connection-string': connectionString, 'collection-name-queues': collectionNameQueues, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'MongoDb',
                doesIdentifierMatchItem() {
                    return false;
                },
                connectionString,
                collectionNames: {
                    queues: collectionNameQueues
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the MongoDB priority queue store...');
                const store = await createPriorityQueueStore_1.createPriorityQueueStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the MongoDB priority queue store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the MongoDB priority queue store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.priorityQueueMongoDbCommand = priorityQueueMongoDbCommand;
//# sourceMappingURL=priorityQueueMongoDbCommand.js.map