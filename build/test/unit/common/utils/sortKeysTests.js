"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const sortKeys_1 = require("../../../../lib/common/utils/sortKeys");
suite('sortKeys', () => {
    test('sorts the keys of a shallow object.', async () => {
        const value = {
            bb: 'b',
            aa: 'a',
            cc: 'c'
        };
        const sorted = sortKeys_1.sortKeys({ object: value });
        assertthat_1.assert.that(Object.keys(sorted)).is.equalTo(['aa', 'bb', 'cc']);
    });
    test('sorts only the outer most keys of a nested object.', async () => {
        const value = {
            bb: 'b',
            aa: {
                dd: 'd',
                bb: 'b'
            },
            cc: 'c'
        };
        const sorted = sortKeys_1.sortKeys({ object: value });
        assertthat_1.assert.that(Object.keys(sorted)).is.equalTo(['aa', 'bb', 'cc']);
        assertthat_1.assert.that(Object.keys(sorted.aa)).is.equalTo(['dd', 'bb']);
    });
    test('sorts recursively if instructed to do so.', async () => {
        const value = {
            bb: 'b',
            aa: {
                dd: 'd',
                bb: 'b'
            },
            cc: 'c'
        };
        const sorted = sortKeys_1.sortKeys({ object: value, recursive: true });
        assertthat_1.assert.that(Object.keys(sorted)).is.equalTo(['aa', 'bb', 'cc']);
        assertthat_1.assert.that(Object.keys(sorted.aa)).is.equalTo(['bb', 'dd']);
    });
});
//# sourceMappingURL=sortKeysTests.js.map