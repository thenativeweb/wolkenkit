"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileS3Command = void 0;
const buntstift_1 = require("buntstift");
const createFileStore_1 = require("../../../../../stores/fileStore/createFileStore");
const fileS3Command = function () {
    return {
        name: 's3',
        description: 'Set up an S3 file store.',
        optionDefinitions: [
            {
                name: 'host-name',
                type: 'string',
                isRequired: true
            },
            {
                name: 'port',
                type: 'number',
                isRequired: true
            },
            {
                name: 'enrypt-connection',
                type: 'boolean',
                defaultValue: false
            },
            {
                name: 'access-key',
                type: 'string',
                isRequired: true
            },
            {
                name: 'secret-key',
                type: 'string',
                isRequired: true
            },
            {
                name: 'region',
                type: 'string'
            },
            {
                name: 'bucket-name',
                type: 'string',
                isRequired: true
            }
        ],
        async handle({ options: { 'host-name': hostName, port, 'encrypt-connection': encryptConnection, 'access-key': accessKey, 'secret-key': secretKey, region, 'bucket-name': bucketName, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeOptions = {
                type: 'S3',
                hostName,
                port,
                encryptConnection,
                accessKey,
                secretKey,
                region,
                bucketName
            };
            try {
                buntstift_1.buntstift.info('Setting up the S3 file store...');
                const store = await createFileStore_1.createFileStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the S3 file store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the S3 file store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.fileS3Command = fileS3Command;
//# sourceMappingURL=fileS3Command.js.map