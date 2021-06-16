"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priorityQueueSqlServerCommand = void 0;
const buntstift_1 = require("buntstift");
const createPriorityQueueStore_1 = require("../../../../../stores/priorityQueueStore/createPriorityQueueStore");
const priorityQueueSqlServerCommand = function () {
    return {
        name: 'sqlserver',
        description: 'Set up a SQL Server priority queue store.',
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
                name: 'encrypt-connection',
                type: 'boolean'
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
        async handle({ options: { 'host-name': hostName, port, 'user-name': userName, password, database, 'encrypt-connection': encryptConnection, 'table-name-items': tableNameItems, 'table-name-priority-queue': tableNamePriorityQueue, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'SqlServer',
                doesIdentifierMatchItem() {
                    return false;
                },
                hostName,
                port,
                userName,
                password,
                database,
                encryptConnection,
                tableNames: {
                    items: tableNameItems,
                    priorityQueue: tableNamePriorityQueue
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the SQL Server priority queue store...');
                const store = await createPriorityQueueStore_1.createPriorityQueueStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the SQL Server priority queue store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the SQL Server priority queue store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.priorityQueueSqlServerCommand = priorityQueueSqlServerCommand;
//# sourceMappingURL=priorityQueueSqlServerCommand.js.map