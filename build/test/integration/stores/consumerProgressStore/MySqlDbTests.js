"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const MySql_1 = require("../../../../lib/stores/consumerProgressStore/MySql");
suite('MySql', () => {
    getTestsFor_1.getTestsFor({
        async createConsumerProgressStore({ suffix }) {
            return await MySql_1.MySqlConsumerProgressStore.create({
                type: 'MySql',
                ...connectionOptions_1.connectionOptions.mySql,
                tableNames: {
                    progress: `progress_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=MySqlDbTests.js.map