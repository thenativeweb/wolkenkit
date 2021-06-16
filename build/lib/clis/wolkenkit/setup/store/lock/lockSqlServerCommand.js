"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockSqlServerCommand = void 0;
const buntstift_1 = require("buntstift");
const createLockStore_1 = require("../../../../../stores/lockStore/createLockStore");
const lockSqlServerCommand = function () {
    return {
        name: 'sqlserver',
        description: 'Set up a SQL Server lock store.',
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
                name: 'table-name-locks',
                type: 'string',
                defaultValue: 'locks'
            }
        ],
        async handle({ options: { 'host-name': hostName, port, 'user-name': userName, password, database, 'encrypt-connection': encryptConnection, 'table-name-locks': tableNameLocks, verbose } }) {
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
                    locks: tableNameLocks
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the SQL Server lock store...');
                const store = await createLockStore_1.createLockStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the SQL Server lock store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the SQL Server lock store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.lockSqlServerCommand = lockSqlServerCommand;
//# sourceMappingURL=lockSqlServerCommand.js.map