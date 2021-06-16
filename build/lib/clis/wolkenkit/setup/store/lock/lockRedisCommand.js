"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockRedisCommand = void 0;
const buntstift_1 = require("buntstift");
const createLockStore_1 = require("../../../../../stores/lockStore/createLockStore");
const lockRedisCommand = function () {
    return {
        name: 'redis',
        description: 'Set up a Redis lock store.',
        optionDefinitions: [
            {
                name: 'host-name',
                type: 'string',
                isRequired: true
            },
            {
                name: 'port',
                type: 'number',
                defaultValue: 6379
            },
            {
                name: 'password',
                type: 'string',
                isRequired: true
            },
            {
                name: 'database',
                type: 'number',
                defaultValue: 0
            },
            {
                name: 'list-name-locks',
                type: 'string',
                isRequired: true
            }
        ],
        async handle({ options: { 'host-name': hostName, port, password, database, 'list-name-locks': listNameLocks, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'Redis',
                hostName,
                port,
                password,
                database,
                listNames: {
                    locks: listNameLocks
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the Redis lock store...');
                const store = await createLockStore_1.createLockStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the Redis lock store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the Redis lock store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.lockRedisCommand = lockRedisCommand;
//# sourceMappingURL=lockRedisCommand.js.map