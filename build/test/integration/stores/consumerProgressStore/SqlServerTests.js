"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const SqlServer_1 = require("../../../../lib/stores/consumerProgressStore/SqlServer");
suite('SqlServer', () => {
    getTestsFor_1.getTestsFor({
        async createConsumerProgressStore({ suffix }) {
            return await SqlServer_1.SqlServerConsumerProgressStore.create({
                type: 'SqlServer',
                ...connectionOptions_1.connectionOptions.sqlServer,
                tableNames: {
                    progress: `progress_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=SqlServerTests.js.map