"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const Postgres_1 = require("../../../../lib/stores/domainEventStore/Postgres");
suite('Postgres', () => {
    getTestsFor_1.getTestsFor({
        async createDomainEventStore({ suffix }) {
            return await Postgres_1.PostgresDomainEventStore.create({
                type: 'Postgres',
                ...connectionOptions_1.connectionOptions.postgres,
                tableNames: {
                    domainEvents: `domain-events_${suffix}`,
                    snapshots: `snapshots_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=PostgresTests.js.map