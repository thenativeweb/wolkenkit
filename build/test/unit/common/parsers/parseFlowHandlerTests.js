"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseFlowHandler_1 = require("../../../../lib/common/parsers/parseFlowHandler");
suite('parseFlowHandler', () => {
    const domainEventHandler = {
        isRelevant() {
            return true;
        },
        handle() {
            // Intentionally left blank.
        }
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseFlowHandler_1.parseFlowHandler({ domainEventHandler })).is.not.anError();
    });
    test('returns an error if the given domain event handler is not an object.', async () => {
        assertthat_1.assert.that(parseFlowHandler_1.parseFlowHandler({ domainEventHandler: undefined })).is.anErrorWithMessage(`Property 'domainEventHandler' is not an object.`);
    });
    test('returns an error if is relevant is missing.', async () => {
        assertthat_1.assert.that(parseFlowHandler_1.parseFlowHandler({ domainEventHandler: {
                ...domainEventHandler,
                isRelevant: undefined
            } })).is.anErrorWithMessage(`Function 'isRelevant' is missing.`);
    });
    test('returns an error if is relevant is not a function.', async () => {
        assertthat_1.assert.that(parseFlowHandler_1.parseFlowHandler({ domainEventHandler: {
                ...domainEventHandler,
                isRelevant: {}
            } })).is.anErrorWithMessage(`Property 'isRelevant' is not a function.`);
    });
    test('returns an error if handle is missing.', async () => {
        assertthat_1.assert.that(parseFlowHandler_1.parseFlowHandler({ domainEventHandler: {
                ...domainEventHandler,
                handle: undefined
            } })).is.anErrorWithMessage(`Function 'handle' is missing.`);
    });
    test('returns an error if handle is not a function.', async () => {
        assertthat_1.assert.that(parseFlowHandler_1.parseFlowHandler({ domainEventHandler: {
                ...domainEventHandler,
                handle: {}
            } })).is.anErrorWithMessage(`Property 'handle' is not a function.`);
    });
});
//# sourceMappingURL=parseFlowHandlerTests.js.map