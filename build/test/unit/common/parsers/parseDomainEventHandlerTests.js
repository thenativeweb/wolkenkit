"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseDomainEventHandler_1 = require("../../../../lib/common/parsers/parseDomainEventHandler");
suite('parseDomainEventHandler', () => {
    const domainEventHandler = {
        isAuthorized() {
            // Intentionally left blank.
        },
        handle() {
            // Intentionally left blank.
        }
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler })).is.not.anError();
    });
    test('returns an error if the given domain event handler is not an object.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler: undefined })).is.anErrorWithMessage(`Property 'domainEventHandler' is not an object.`);
    });
    test('returns an error if handle is missing.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler: {
                ...domainEventHandler,
                handle: undefined
            } })).is.anErrorWithMessage(`Function 'handle' is missing.`);
    });
    test('returns an error if handle is not a function.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler: {
                ...domainEventHandler,
                handle: {}
            } })).is.anErrorWithMessage(`Property 'handle' is not a function.`);
    });
    test('returns an error if isAuthorized is missing.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler: {
                ...domainEventHandler,
                isAuthorized: undefined
            } })).is.anErrorWithMessage(`Function 'isAuthorized' is missing.`);
    });
    test('returns an error if isAuthorized is not a function.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler: {
                ...domainEventHandler,
                isAuthorized: {}
            } })).is.anErrorWithMessage(`Property 'isAuthorized' is not a function.`);
    });
    test('returns an error if getDocumentation is not a function.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler: {
                ...domainEventHandler,
                getDocumentation: {}
            } })).is.anErrorWithMessage(`Property 'getDocumentation' is not a function.`);
    });
    test('returns an error if getSchema is not a function.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler: {
                ...domainEventHandler,
                getSchema: {}
            } })).is.anErrorWithMessage(`Property 'getSchema' is not a function.`);
    });
    test('returns an error if filter is not a function.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler: {
                ...domainEventHandler,
                filter: {}
            } })).is.anErrorWithMessage(`Property 'filter' is not a function.`);
    });
    test('returns an error if map is not a function.', async () => {
        assertthat_1.assert.that(parseDomainEventHandler_1.parseDomainEventHandler({ domainEventHandler: {
                ...domainEventHandler,
                map: {}
            } })).is.anErrorWithMessage(`Property 'map' is not a function.`);
    });
});
//# sourceMappingURL=parseDomainEventHandlerTests.js.map