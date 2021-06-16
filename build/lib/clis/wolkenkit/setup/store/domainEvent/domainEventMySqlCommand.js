"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainEventMySqlCommand = void 0;
const buntstift_1 = require("buntstift");
const createDomainEventStore_1 = require("../../../../../stores/domainEventStore/createDomainEventStore");
const domainEventMySqlCommand = function () {
    return {
        name: 'mysql',
        description: 'Set up a MySQL domain event store.',
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
                name: 'table-name-domain-events',
                type: 'string',
                defaultValue: 'domain-events'
            },
            {
                name: 'table-name-snapshots',
                type: 'string',
                defaultValue: 'snapshots'
            }
        ],
        async handle({ options: { 'host-name': hostName, port, 'user-name': userName, password, database, 'table-name-domain-events': tableNameDomainEvents, 'table-name-snapshots': tableNameSnapshots, verbose } }) {
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
                    domainEvents: tableNameDomainEvents,
                    snapshots: tableNameSnapshots
                }
            };
            try {
                buntstift_1.buntstift.info('Setting up the MySQL domain event store...');
                const store = await createDomainEventStore_1.createDomainEventStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the MySQL domain event store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the MySQL domain event store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.domainEventMySqlCommand = domainEventMySqlCommand;
//# sourceMappingURL=domainEventMySqlCommand.js.map