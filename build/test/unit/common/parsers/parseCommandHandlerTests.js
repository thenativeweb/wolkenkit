"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseCommandHandler_1 = require("../../../../lib/common/parsers/parseCommandHandler");
suite('parseCommandHandler', () => {
    const commandHandler = {
        isAuthorized() {
            // Intentionally left blank.
        },
        handle() {
            // Intentionally left blank.
        },
        getDocumentation() {
            // Intentionally left blank.
        },
        getSchema() {
            // Intentionally left blank.
        }
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseCommandHandler_1.parseCommandHandler({ commandHandler })).is.not.anError();
    });
    test('returns an error if the given command handler is not an object.', async () => {
        assertthat_1.assert.that(parseCommandHandler_1.parseCommandHandler({ commandHandler: undefined })).is.anErrorWithMessage(`Property 'commandHandler' is not an object.`);
    });
    test('returns an error if isAuthorized is missing.', async () => {
        assertthat_1.assert.that(parseCommandHandler_1.parseCommandHandler({ commandHandler: {
                ...commandHandler,
                isAuthorized: undefined
            } })).is.anErrorWithMessage(`Function 'isAuthorized' is missing.`);
    });
    test('returns an error if isAuthorized is not a function.', async () => {
        assertthat_1.assert.that(parseCommandHandler_1.parseCommandHandler({ commandHandler: {
                ...commandHandler,
                isAuthorized: {}
            } })).is.anErrorWithMessage(`Property 'isAuthorized' is not a function.`);
    });
    test('returns an error if handle is missing.', async () => {
        assertthat_1.assert.that(parseCommandHandler_1.parseCommandHandler({ commandHandler: {
                ...commandHandler,
                handle: undefined
            } })).is.anErrorWithMessage(`Function 'handle' is missing.`);
    });
    test('returns an error if handle is not a function.', async () => {
        assertthat_1.assert.that(parseCommandHandler_1.parseCommandHandler({ commandHandler: {
                ...commandHandler,
                handle: {}
            } })).is.anErrorWithMessage(`Property 'handle' is not a function.`);
    });
    test('returns an error if getDocumentation is not a function.', async () => {
        assertthat_1.assert.that(parseCommandHandler_1.parseCommandHandler({ commandHandler: {
                ...commandHandler,
                getDocumentation: {}
            } })).is.anErrorWithMessage(`Property 'getDocumentation' is not a function.`);
    });
    test('returns an error if getSchema is not a function.', async () => {
        assertthat_1.assert.that(parseCommandHandler_1.parseCommandHandler({ commandHandler: {
                ...commandHandler,
                getSchema: {}
            } })).is.anErrorWithMessage(`Property 'getSchema' is not a function.`);
    });
});
//# sourceMappingURL=parseCommandHandlerTests.js.map