"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainEventMongoDbCommand = void 0;
const buntstift_1 = require("buntstift");
const createDomainEventStore_1 = require("../../../../../stores/domainEventStore/createDomainEventStore");
const domainEventMongoDbCommand = function () {
    return {
        name: 'mongodb',
        description: 'Set up a MongoDB domain event store.',
        optionDefinitions: [
            {
                name: 'connection-string',
                type: 'string',
                isRequired: true
            },
            {
                name: 'collection-name-domain-events',
                type: 'string',
                defaultValue: 'domain-events'
            },
            {
                name: 'collection-name-snapshots',
                type: 'string',
                defaultValue: 'snapshots'
            }
        ],
        async handle({ options: { 'connection-string': connectionString, 'collection-name-domain-events': collectionNameDomainEvents, 'collection-name-snapshots': collectionNameSnapshots, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'MongoDb',
                connectionString,
                collectionNames: {
                    domainEvents: collectionNameDomainEvents,
                    snapshots: collectionNameSnapshots
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the MongoDB domain event store...');
                const store = await createDomainEventStore_1.createDomainEventStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the MongoDB domain event store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the MongoDB domain event store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.domainEventMongoDbCommand = domainEventMongoDbCommand;
//# sourceMappingURL=domainEventMongoDbCommand.js.map