"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseNotificationHandler_1 = require("../../../../lib/common/parsers/parseNotificationHandler");
suite('parseNotificationHandler', () => {
    const notificationHandler = {
        isAuthorized() {
            return true;
        }
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseNotificationHandler_1.parseNotificationHandler({ notificationHandler })).is.not.anError();
    });
    test('returns an error if the given notification handler is not an object.', async () => {
        assertthat_1.assert.that(parseNotificationHandler_1.parseNotificationHandler({ notificationHandler: undefined })).is.anErrorWithMessage(`Notification handler is not an object.`);
    });
    test('returns an error if the notification handler has no is authorized function.', async () => {
        assertthat_1.assert.that(parseNotificationHandler_1.parseNotificationHandler({
            notificationHandler: {}
        })).is.anErrorWithMessage(`Function 'isAuthorized' is missing.`);
    });
    test(`returns an error if the notification handler's is authorized property is not a function.`, async () => {
        assertthat_1.assert.that(parseNotificationHandler_1.parseNotificationHandler({
            notificationHandler: {
                isAuthorized: false
            }
        })).is.anErrorWithMessage(`Property 'isAuthorized' is not a function.`);
    });
    test(`returns an error if the notification handler's get data schema property is not a function.`, async () => {
        assertthat_1.assert.that(parseNotificationHandler_1.parseNotificationHandler({
            notificationHandler: {
                ...notificationHandler,
                getDataSchema: false
            }
        })).is.anErrorWithMessage(`Property 'getDataSchema' is not a function.`);
    });
    test(`returns an error if the notification handler's get metadata schema property is not a function.`, async () => {
        assertthat_1.assert.that(parseNotificationHandler_1.parseNotificationHandler({
            notificationHandler: {
                ...notificationHandler,
                getMetadataSchema: false
            }
        })).is.anErrorWithMessage(`Property 'getMetadataSchema' is not a function.`);
    });
    test(`returns an error if the notification handler's get description property is not a function.`, async () => {
        assertthat_1.assert.that(parseNotificationHandler_1.parseNotificationHandler({
            notificationHandler: {
                ...notificationHandler,
                getDocumentation: false
            }
        })).is.anErrorWithMessage(`Property 'getDocumentation' is not a function.`);
    });
});
//# sourceMappingURL=parseNotificationHandlerTests.js.map