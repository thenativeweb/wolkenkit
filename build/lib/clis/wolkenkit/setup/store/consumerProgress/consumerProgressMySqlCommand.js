"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumerProgressMySqlCommand = void 0;
const buntstift_1 = require("buntstift");
const createConsumerProgressStore_1 = require("../../../../../stores/consumerProgressStore/createConsumerProgressStore");
const consumerProgressMySqlCommand = function () {
    return {
        name: 'mysql',
        description: 'Set up a MySQL consumer progress store.',
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
                name: 'table-name-progress',
                type: 'string',
                defaultValue: 'progress'
            }
        ],
        async handle({ options: { 'host-name': hostName, port, 'user-name': userName, password, database, 'table-name-progress': tableNameProgress, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'MySql',
                hostName,
                port,
                userName,
                password,
                database,
                tableNames: {
                    progress: tableNameProgress
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the MySQL consumer progress store...');
                const store = await createConsumerProgressStore_1.createConsumerProgressStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the MySQL consumer progress store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the MySQL consumer progress store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.consumerProgressMySqlCommand = consumerProgressMySqlCommand;
//# sourceMappingURL=consumerProgressMySqlCommand.js.map