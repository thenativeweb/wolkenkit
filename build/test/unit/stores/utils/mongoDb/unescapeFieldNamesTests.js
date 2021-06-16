"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const escapeFieldNames_1 = require("../../../../../lib/stores/utils/mongoDb/escapeFieldNames");
suite('unescapeFieldNames', () => {
    test('returns the given object with unescaped keys.', async () => {
        const escaped = escapeFieldNames_1.unescapeFieldNames({
            foo: 23,
            'bar\\dotbaz': {
                '\\dollarbas': 42
            },
            '\\\\\\dot\\dollar': 7
        });
        assertthat_1.assert.that(escaped).is.equalTo({
            foo: 23,
            'bar.baz': {
                $bas: 42
            },
            '\\.$': 7
        });
    });
});
//# sourceMappingURL=unescapeFieldNamesTests.js.map