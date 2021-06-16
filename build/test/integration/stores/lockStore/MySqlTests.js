"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const MySql_1 = require("../../../../lib/stores/lockStore/MySql");
suite('MySql', () => {
    getTestsFor_1.getTestsFor({
        async createLockStore({ suffix }) {
            return await MySql_1.MySqlLockStore.create({
                type: 'MySql',
                ...connectionOptions_1.connectionOptions.mySql,
                tableNames: {
                    locks: `locks_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=MySqlTests.js.map