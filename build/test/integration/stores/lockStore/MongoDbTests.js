"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const MongoDb_1 = require("../../../../lib/stores/lockStore/MongoDb");
suite('MongoDb', () => {
    getTestsFor_1.getTestsFor({
        async createLockStore({ suffix }) {
            return await MongoDb_1.MongoDbLockStore.create({
                type: 'MongoDb',
                ...connectionOptions_1.connectionOptions.mongoDb,
                collectionNames: {
                    locks: `locks_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=MongoDbTests.js.map