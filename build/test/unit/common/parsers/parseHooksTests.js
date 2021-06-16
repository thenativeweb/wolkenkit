"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseHooks_1 = require("../../../../lib/common/parsers/parseHooks");
const uuid_1 = require("uuid");
suite('parseHooks', () => {
    const hooksDefinition = {
        async addedFile() {
            // Intentionally left blank.
        },
        async addingFile() {
            return {
                name: uuid_1.v4(),
                contentType: 'text/plain'
            };
        },
        async removedFile() {
            // Intentionally left blank.
        },
        async removingFile() {
            // Intentionally left blank.
        }
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseHooks_1.parseHooks({ hooksDefinition })).is.not.anError();
    });
    test('returns an error if the given hooks definition is not an object.', async () => {
        assertthat_1.assert.that(parseHooks_1.parseHooks({ hooksDefinition: undefined })).is.anErrorWithMessage('Hooks definition is not an object.');
    });
    test('returns an error if addedFile is not a function.', async () => {
        assertthat_1.assert.that(parseHooks_1.parseHooks({
            hooksDefinition: {
                ...hooksDefinition,
                addedFile: false
            }
        })).is.anErrorWithMessage(`Property 'addedFile' is not a function.`);
    });
    test('returns an error if addingFile is not a function.', async () => {
        assertthat_1.assert.that(parseHooks_1.parseHooks({
            hooksDefinition: {
                ...hooksDefinition,
                addingFile: false
            }
        })).is.anErrorWithMessage(`Property 'addingFile' is not a function.`);
    });
    test('returns an error if removedFile is not a function.', async () => {
        assertthat_1.assert.that(parseHooks_1.parseHooks({
            hooksDefinition: {
                ...hooksDefinition,
                removedFile: false
            }
        })).is.anErrorWithMessage(`Property 'removedFile' is not a function.`);
    });
    test('returns an error if removingFile is not a function.', async () => {
        assertthat_1.assert.that(parseHooks_1.parseHooks({
            hooksDefinition: {
                ...hooksDefinition,
                removingFile: false
            }
        })).is.anErrorWithMessage(`Property 'removingFile' is not a function.`);
    });
});
//# sourceMappingURL=parseHooksTests.js.map