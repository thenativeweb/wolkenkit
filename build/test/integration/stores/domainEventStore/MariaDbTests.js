"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const MySql_1 = require("../../../../lib/stores/domainEventStore/MySql");
suite('MariaDb', () => {
    getTestsFor_1.getTestsFor({
        async createDomainEventStore({ suffix }) {
            return await MySql_1.MySqlDomainEventStore.create({
                type: 'MariaDb',
                ...connectionOptions_1.connectionOptions.mariaDb,
                tableNames: {
                    domainEvents: `domain-events_${suffix}`,
                    snapshots: `snapshots_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=MariaDbTests.js.map