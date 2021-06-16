"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const file_exists_1 = require("next/dist/lib/file-exists");
const isolated_1 = require("isolated");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const rootPath = path_1.default.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('setup store file file-system', function () {
    this.timeout(30000);
    test(`sets up a file system for the file store.`, async () => {
        const temporaryDirectory = await isolated_1.isolated();
        const storeDirectory = path_1.default.join(temporaryDirectory, 'fileStore');
        const setupS3FileStoreCommand = `node ${cliPath} --verbose setup store file file-system --directory ${storeDirectory}`;
        const { stdout } = shelljs_1.default.exec(setupS3FileStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the file-system file store.');
        await file_exists_1.fileExists(storeDirectory);
    });
});
//# sourceMappingURL=fileSystemTests.js.map