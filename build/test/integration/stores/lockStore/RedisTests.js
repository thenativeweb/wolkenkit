"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const Redis_1 = require("../../../../lib/stores/lockStore/Redis");
suite('Redis', () => {
    getTestsFor_1.getTestsFor({
        async createLockStore({ suffix }) {
            return await Redis_1.RedisLockStore.create({
                type: 'Redis',
                ...connectionOptions_1.connectionOptions.redis,
                listNames: {
                    locks: `locks_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=RedisTests.js.map