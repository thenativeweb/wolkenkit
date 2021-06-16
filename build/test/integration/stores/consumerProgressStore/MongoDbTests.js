"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const MongoDb_1 = require("../../../../lib/stores/consumerProgressStore/MongoDb");
suite('MongoDb', () => {
    getTestsFor_1.getTestsFor({
        async createConsumerProgressStore({ suffix }) {
            return await MongoDb_1.MongoDbConsumerProgressStore.create({
                type: 'MongoDb',
                ...connectionOptions_1.connectionOptions.mongoDb,
                collectionNames: {
                    progress: `progress_${suffix}`
                }
            });
        }
    });
});
//# sourceMappingURL=MongoDbTests.js.map