"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const Postgres_1 = require("../../../../lib/stores/lockStore/Postgres");
suite('Postgres', () => {
    getTestsFor_1.getTestsFor({
        async createLockStore({ suffix }) {
            return await Postgres_1.PostgresLockStore.create({
                type: 'Postgres',
                ...connectionOptions_1.connectionOptions.postgres,
                tableNames: {
                    locks: `locks_${suffix}`
                },
                encryptConnection: false
            });
        }
    });
});
//# sourceMappingURL=PostgresTests.js.map