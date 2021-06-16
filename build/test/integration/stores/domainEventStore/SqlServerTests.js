"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const SqlServer_1 = require("../../../../lib/stores/domainEventStore/SqlServer");
suite('SqlServer', () => {
    getTestsFor_1.getTestsFor({
        async createDomainEventStore({ suffix }) {
            return await SqlServer_1.SqlServerDomainEventStore.create({
                type: 'SqlServer',
                ...connectionOptions_1.connectionOptions.sqlServer,
                tableNames: {
                    domainEvents: `domain-events_${suffix}`,
                    snapshots: `snapshots_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=SqlServerTests.js.map