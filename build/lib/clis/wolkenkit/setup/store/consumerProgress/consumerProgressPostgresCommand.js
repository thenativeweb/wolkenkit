"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumerProgressPostgresCommand = void 0;
const buntstift_1 = require("buntstift");
const createConsumerProgressStore_1 = require("../../../../../stores/consumerProgressStore/createConsumerProgressStore");
const consumerProgressPostgresCommand = function () {
    return {
        name: 'postgres',
        description: 'Set up a PostgreSQL consumer progress store.',
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
                type: 'Postgres',
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
                buntstift_1.buntstift.info('Setting up the PostgreSQL consumer progress store...');
                const store = await createConsumerProgressStore_1.createConsumerProgressStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the PostgreSQL consumer progress store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the PostgreSQL consumer progress store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.consumerProgressPostgresCommand = consumerProgressPostgresCommand;
//# sourceMappingURL=consumerProgressPostgresCommand.js.map