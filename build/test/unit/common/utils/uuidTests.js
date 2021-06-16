"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const uuid_1 = require("../../../../lib/common/utils/uuid");
const uuid_2 = require("uuid");
suite('uuid', () => {
    suite('regex', () => {
        let uuid;
        setup(async () => {
            uuid = uuid_2.v4();
        });
        test('is a regular expression that matches a UUID v4.', async () => {
            assertthat_1.assert.that(uuid).is.matching(uuid_1.regex);
        });
        test('is a regular expression that correctly matches the start of a UUID v4.', async () => {
            assertthat_1.assert.that(`31${uuid}`).is.not.matching(uuid_1.regex);
        });
        test('is a regular expression that correctly matches the end of a UUID v4.', async () => {
            assertthat_1.assert.that(`${uuid}31`).is.not.matching(uuid_1.regex);
        });
    });
});
//# sourceMappingURL=uuidTests.js.map