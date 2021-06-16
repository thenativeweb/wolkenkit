"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseNotificationSubscriber_1 = require("../../../../lib/common/parsers/parseNotificationSubscriber");
suite('parseNotificationSubscriber', () => {
    const notificationSubscriber = {
        isRelevant() {
            return true;
        },
        handle() {
            // Intentionally left empty.
        }
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseNotificationSubscriber_1.parseNotificationSubscriber({
            notificationSubscriber
        })).is.not.anError();
    });
    test('returns an error if the notification subscriber is not an object.', async () => {
        assertthat_1.assert.that(parseNotificationSubscriber_1.parseNotificationSubscriber({
            notificationSubscriber: undefined
        })).is.anErrorWithMessage('Notification subscriber is not an object.');
    });
    test('returns an error if is relevant is missing.', async () => {
        assertthat_1.assert.that(parseNotificationSubscriber_1.parseNotificationSubscriber({ notificationSubscriber: {
                ...notificationSubscriber,
                isRelevant: undefined
            } })).is.anErrorWithMessage(`Function 'isRelevant' is missing.`);
    });
    test('returns an error if is relevant is not a function.', async () => {
        assertthat_1.assert.that(parseNotificationSubscriber_1.parseNotificationSubscriber({ notificationSubscriber: {
                ...notificationSubscriber,
                isRelevant: {}
            } })).is.anErrorWithMessage(`Property 'isRelevant' is not a function.`);
    });
    test('returns an error if handle is missing.', async () => {
        assertthat_1.assert.that(parseNotificationSubscriber_1.parseNotificationSubscriber({ notificationSubscriber: {
                ...notificationSubscriber,
                handle: undefined
            } })).is.anErrorWithMessage(`Function 'handle' is missing.`);
    });
    test('returns an error if handle is not a function.', async () => {
        assertthat_1.assert.that(parseNotificationSubscriber_1.parseNotificationSubscriber({ notificationSubscriber: {
                ...notificationSubscriber,
                handle: {}
            } })).is.anErrorWithMessage(`Property 'handle' is not a function.`);
    });
});
//# sourceMappingURL=parseNotificationSubscriberTests.js.map