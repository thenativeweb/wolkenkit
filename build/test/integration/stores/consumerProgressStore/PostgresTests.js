"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const Postgres_1 = require("../../../../lib/stores/consumerProgressStore/Postgres");
suite('Postgres', () => {
    getTestsFor_1.getTestsFor({
        async createConsumerProgressStore({ suffix }) {
            return await Postgres_1.PostgresConsumerProgressStore.create({
                type: 'Postgres',
                ...connectionOptions_1.connectionOptions.postgres,
                tableNames: {
                    progress: `progress_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=PostgresTests.js.map