"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const minio_1 = require("minio");
const connectionOptions_1 = require("../../../../shared/containers/connectionOptions");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const uuid_1 = require("uuid");
const rootPath = path_1.default.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('setup store file s3', function () {
    this.timeout(30000);
    test(`sets up a s3 for the file store.`, async () => {
        const { hostName, port, accessKey, secretKey, encryptConnection } = connectionOptions_1.connectionOptions.minio;
        const bucketName = uuid_1.v4();
        const setupS3FileStoreCommand = `node ${cliPath} --verbose setup store file s3 --host-name ${hostName} --port ${port} ${encryptConnection ? '--encryptConnection' : ''} --access-key ${accessKey} --secret-key ${secretKey} --bucket-name ${bucketName}`;
        const { stdout } = shelljs_1.default.exec(setupS3FileStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the S3 file store.');
        const client = new minio_1.Client({
            endPoint: hostName,
            port,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            useSSL: encryptConnection,
            accessKey,
            secretKey
        });
        assertthat_1.assert.that(await client.bucketExists(bucketName)).is.true();
    });
});
//# sourceMappingURL=s3Tests.js.map