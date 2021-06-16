"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getHash_1 = require("../../../../../lib/common/utils/crypto/getHash");
suite('getHash', () => {
    test('returns the SHA256 hash for the given value.', async () => {
        const hash = getHash_1.getHash({ value: 'the native web' });
        assertthat_1.assert.that(hash).is.equalTo('55a1f59420da66b2c4c87b565660054cff7c2aad5ebe5f56e04ae0f2a20f00a9');
    });
});
//# sourceMappingURL=getHashTests.js.map