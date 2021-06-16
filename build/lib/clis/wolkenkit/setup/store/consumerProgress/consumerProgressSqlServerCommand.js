"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumerProgressSqlServerCommand = void 0;
const buntstift_1 = require("buntstift");
const createConsumerProgressStore_1 = require("../../../../../stores/consumerProgressStore/createConsumerProgressStore");
const consumerProgressSqlServerCommand = function () {
    return {
        name: 'sqlserver',
        description: 'Set up a SQL Server consumer progress store.',
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
                name: 'table-name-progress',
                type: 'string',
                defaultValue: 'progress'
            }
        ],
        async handle({ options: { 'host-name': hostName, port, 'user-name': userName, password, database, 'encrypt-connection': encryptConnection, 'table-name-progress': tableNameProgress, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'SqlServer',
                hostName,
                port,
                userName,
                password,
                database,
                encryptConnection,
                tableNames: {
                    progress: tableNameProgress
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the SQL Server consumer progress store...');
                const store = await createConsumerProgressStore_1.createConsumerProgressStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the SQL Server consumer progress store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the SQL Server consumer progress store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.consumerProgressSqlServerCommand = consumerProgressSqlServerCommand;
//# sourceMappingURL=consumerProgressSqlServerCommand.js.map