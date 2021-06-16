"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getAbsolutePath_1 = require("../../../../../lib/common/utils/path/getAbsolutePath");
suite('getAbsolutePath', () => {
    test('returns the given path if it already is absolute.', async () => {
        const absolutePath = getAbsolutePath_1.getAbsolutePath({ path: '/foo/bar', cwd: '/base' });
        assertthat_1.assert.that(absolutePath).is.equalTo('/foo/bar');
    });
    test('returns the given path relative to the home directory if the path contains a tilde.', async () => {
        const absolutePath = getAbsolutePath_1.getAbsolutePath({ path: '~/foo/bar', cwd: '/base' });
        assertthat_1.assert.that(absolutePath).is.startingWith('/');
        assertthat_1.assert.that(absolutePath).is.not.startingWith('/base/');
    });
    test('returns the given path relative to the current working directory if it is relative.', async () => {
        const absolutePath = getAbsolutePath_1.getAbsolutePath({ path: 'foo/bar', cwd: '/base' });
        assertthat_1.assert.that(absolutePath).is.equalTo('/base/foo/bar');
    });
});
//# sourceMappingURL=getAbsolutePathTests.js.map