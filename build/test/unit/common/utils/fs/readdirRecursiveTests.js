"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const isolated_1 = require("isolated");
const path_1 = __importDefault(require("path"));
const readdirRecursive_1 = require("../../../../../lib/common/utils/fs/readdirRecursive");
const shelljs_1 = require("shelljs");
suite('readdirRecursive', () => {
    test('returns empty arrays for an empty directory.', async () => {
        const directory = await isolated_1.isolated();
        const { directories, files } = await readdirRecursive_1.readdirRecursive({ path: directory });
        assertthat_1.assert.that(directories).is.equalTo([]);
        assertthat_1.assert.that(files).is.equalTo([]);
    });
    test('returns a list of files for a directory that contains only files.', async () => {
        const directory = await isolated_1.isolated();
        const bar = path_1.default.join(directory, 'bar.txt'), foo = path_1.default.join(directory, 'foo.txt');
        shelljs_1.touch(bar);
        shelljs_1.touch(foo);
        const { directories, files } = await readdirRecursive_1.readdirRecursive({ path: directory });
        assertthat_1.assert.that(directories).is.equalTo([]);
        assertthat_1.assert.that(files).is.equalTo(['bar.txt', 'foo.txt']);
    });
    test('returns a list of directories and files for a directory that contains directories and files.', async () => {
        const directory = await isolated_1.isolated();
        const basDirectory = path_1.default.join(directory, 'bas'), baxDirectory = path_1.default.join(directory, 'bat', 'bax'), bazDirectory = path_1.default.join(directory, 'baz');
        const bar = path_1.default.join(directory, 'bar.txt'), baz = path_1.default.join(directory, 'baz', 'baz.txt'), foo = path_1.default.join(directory, 'foo.txt');
        shelljs_1.mkdir('-p', basDirectory);
        shelljs_1.mkdir('-p', baxDirectory);
        shelljs_1.mkdir('-p', bazDirectory);
        shelljs_1.touch(bar);
        shelljs_1.touch(baz);
        shelljs_1.touch(foo);
        const { directories, files } = await readdirRecursive_1.readdirRecursive({ path: directory });
        assertthat_1.assert.that(directories).is.equalTo([
            'bas',
            'bat',
            path_1.default.join('bat', 'bax'),
            'baz'
        ]);
        assertthat_1.assert.that(files).is.equalTo([
            'bar.txt',
            path_1.default.join('baz', 'baz.txt'),
            'foo.txt'
        ]);
    });
});
//# sourceMappingURL=readdirRecursiveTests.js.map