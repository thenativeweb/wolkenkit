"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseQueryHandler_1 = require("../../../../lib/common/parsers/parseQueryHandler");
suite('parseQueryHandler', () => {
    const queryHandler = {
        type: 'stream',
        isAuthorized() {
            // Intentionally left blank.
        },
        handle() {
            // Intentionally left blank.
        }
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler })).is.not.anError();
    });
    test('returns an error if the given query handler is not an object.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: undefined })).is.anErrorWithMessage(`Query handler is not an object.`);
    });
    test('returns an error if type is missing.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: {
                ...queryHandler,
                type: undefined
            } })).is.anErrorWithMessage(`Property 'type' is missing.`);
    });
    test('returns an error if type is an invalid value.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: {
                ...queryHandler,
                type: 'invalid'
            } })).is.anErrorWithMessage(`Property 'type' must either be 'value' or 'stream'.`);
    });
    test('returns an error if handle is missing.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: {
                ...queryHandler,
                handle: undefined
            } })).is.anErrorWithMessage(`Function 'handle' is missing.`);
    });
    test('returns an error if handle is not a function.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: {
                ...queryHandler,
                handle: {}
            } })).is.anErrorWithMessage(`Property 'handle' is not a function.`);
    });
    test('returns an error if isAuthorized is missing.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: {
                ...queryHandler,
                isAuthorized: undefined
            } })).is.anErrorWithMessage(`Function 'isAuthorized' is missing.`);
    });
    test('returns an error if isAuthorized is not a function.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: {
                ...queryHandler,
                isAuthorized: {}
            } })).is.anErrorWithMessage(`Property 'isAuthorized' is not a function.`);
    });
    test('returns an error if getDocumentation is not a function.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: {
                ...queryHandler,
                getDocumentation: {}
            } })).is.anErrorWithMessage(`Property 'getDocumentation' is not a function.`);
    });
    test('returns an error if getOptionsSchema is not a function.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: {
                ...queryHandler,
                getOptionsSchema: {}
            } })).is.anErrorWithMessage(`Property 'getOptionsSchema' is not a function.`);
    });
    test('returns an error if getItemSchema is not a function.', async () => {
        assertthat_1.assert.that(parseQueryHandler_1.parseQueryHandler({ queryHandler: {
                ...queryHandler,
                getItemSchema: {}
            } })).is.anErrorWithMessage(`Property 'getItemSchema' is not a function.`);
    });
});
//# sourceMappingURL=parseQueryHandlerTests.js.map