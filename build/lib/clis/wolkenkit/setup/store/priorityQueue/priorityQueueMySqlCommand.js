"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priorityQueueMySqlCommand = void 0;
const buntstift_1 = require("buntstift");
const createPriorityQueueStore_1 = require("../../../../../stores/priorityQueueStore/createPriorityQueueStore");
const priorityQueueMySqlCommand = function () {
    return {
        name: 'mysql',
        description: 'Set up a MySQL priority queue store.',
        optionDefinitions: [
            {
                name: 'host-name',
                type: 'string',
                isRequired: true
            },
            {
                name: 'port',
                type: 'number',
                defaultValue: 3363
            },
            {
                name: 'user-name',
                type: 'string',
                isRequired: true
            },
            {
                name: 'password',
                type: 'string',
                isRequired: true
            },
            {
                name: 'database',
                type: 'string',
                isRequired: true
            },
            {
                name: 'table-name-items',
                type: 'string',
                defaultValue: 'items'
            },
            {
                name: 'table-name-priority-queue',
                type: 'string',
                defaultValue: 'priority-queue'
            }
        ],
        async handle({ options: { 'host-name': hostName, port, 'user-name': userName, password, database, 'table-name-items': tableNameItems, 'table-name-priority-queue': tableNamePriorityQueue, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'MySql',
                doesIdentifierMatchItem() {
                    return false;
                },
                hostName,
                port,
                userName,
                password,
                database,
                tableNames: {
                    items: tableNameItems,
                    priorityQueue: tableNamePriorityQueue
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the MySQL priority queue store...');
                const store = await createPriorityQueueStore_1.createPriorityQueueStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the MySQL priority queue store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the MySQL priority queue store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.priorityQueueMySqlCommand = priorityQueueMySqlCommand;
//# sourceMappingURL=priorityQueueMySqlCommand.js.map