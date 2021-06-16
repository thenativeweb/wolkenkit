"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getFiles_1 = require("../../../../../lib/common/utils/fs/getFiles");
const path_1 = __importDefault(require("path"));
const directory = path_1.default.join(__dirname, '..', '..', '..', '..', 'shared', 'files');
suite('getFiles', () => {
    test('returns the files from the given directory recursively.', async () => {
        const files = await getFiles_1.getFiles({ directory });
        const mappedFiles = files.map((file) => file.slice(directory.length));
        assertthat_1.assert.that(mappedFiles).is.equalTo([
            `${path_1.default.sep}someDirectory${path_1.default.sep}someOtherFile.js`,
            `${path_1.default.sep}someDirectory${path_1.default.sep}someOtherFile.json`,
            `${path_1.default.sep}someFile.js`,
            `${path_1.default.sep}someFile.json`
        ]);
    });
    test('does not return the files recursively if recursive is set to false.', async () => {
        const files = await getFiles_1.getFiles({
            directory,
            recursive: false
        });
        const mappedFiles = files.map((file) => file.slice(directory.length));
        assertthat_1.assert.that(mappedFiles).is.equalTo([
            `${path_1.default.sep}someFile.js`,
            `${path_1.default.sep}someFile.json`
        ]);
    });
    test('only returns the files matching the given predicate.', async () => {
        const files = await getFiles_1.getFiles({
            directory,
            predicate: (entry) => entry.name.endsWith('.json')
        });
        const mappedFiles = files.map((file) => file.slice(directory.length));
        assertthat_1.assert.that(mappedFiles).is.equalTo([
            `${path_1.default.sep}someDirectory${path_1.default.sep}someOtherFile.json`,
            `${path_1.default.sep}someFile.json`
        ]);
    });
    test('does not recursively return files matching the given predicate if recursive is set to false.', async () => {
        const files = await getFiles_1.getFiles({
            directory,
            recursive: false,
            predicate: (entry) => entry.name.endsWith('.json')
        });
        const mappedFiles = files.map((file) => file.slice(directory.length));
        assertthat_1.assert.that(mappedFiles).is.equalTo([
            `${path_1.default.sep}someFile.json`
        ]);
    });
    test('throws an error if the given directory does not exist.', async () => {
        await assertthat_1.assert.that(async () => {
            await getFiles_1.getFiles({ directory: path_1.default.join(__dirname, 'does', 'not', 'exist') });
        }).is.throwingAsync((ex) => ex.code === 'ENOENT');
    });
});
//# sourceMappingURL=getFilesTests.js.map