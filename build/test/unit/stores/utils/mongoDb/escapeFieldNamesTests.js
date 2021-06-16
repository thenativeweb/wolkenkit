"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const escapeFieldNames_1 = require("../../../../../lib/stores/utils/mongoDb/escapeFieldNames");
suite('escapeFieldNames', () => {
    test('returns the given object with escaped keys.', async () => {
        const escaped = escapeFieldNames_1.escapeFieldNames({
            foo: 23,
            'bar.baz': {
                $bas: 42
            },
            '\\.$': 7,
            'https://invalid.token/is-anonymous': true
        });
        assertthat_1.assert.that(escaped).is.equalTo({
            foo: 23,
            'bar\\dotbaz': {
                '\\dollarbas': 42
            },
            '\\\\\\dot\\dollar': 7,
            'https://invalid\\dottoken/is-anonymous': true
        });
    });
});
//# sourceMappingURL=escapeFieldNamesTests.js.map