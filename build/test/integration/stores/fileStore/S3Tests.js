"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionOptions_1 = require("../../../shared/containers/connectionOptions");
const getTestsFor_1 = require("./getTestsFor");
const S3_1 = require("../../../../lib/stores/fileStore/S3");
const uuid_1 = require("uuid");
suite('S3', () => {
    getTestsFor_1.getTestsFor({
        async createFileStore() {
            return await S3_1.S3FileStore.create({
                type: 'S3',
                ...connectionOptions_1.connectionOptions.minio,
                bucketName: uuid_1.v4()
            });
        }
    });
});
//# sourceMappingURL=S3Tests.js.map