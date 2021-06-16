"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseNotifications_1 = require("../../../../lib/common/parsers/parseNotifications");
suite('parseNotifications', () => {
    const notificationsDefinition = {
        sampleNotification: {
            isAuthorized() {
                return true;
            }
        }
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseNotifications_1.parseNotifications({ notificationsDefinition })).is.not.anError();
    });
    test('returns an error if the given notifications definition is not an object.', async () => {
        assertthat_1.assert.that(parseNotifications_1.parseNotifications({ notificationsDefinition: undefined })).is.anErrorWithMessage(`Notifications definition is not an object.`);
    });
    test('returns an error if a malformed notification handler is found.', async () => {
        assertthat_1.assert.that(parseNotifications_1.parseNotifications({
            notificationsDefinition: {
                sampleHandler: false
            }
        })).is.anErrorWithMessage(`Notification handler 'sampleHandler' is malformed: Notification handler is not an object.`);
    });
    test('returns an error if a notification handler without is authorized function is found.', async () => {
        assertthat_1.assert.that(parseNotifications_1.parseNotifications({
            notificationsDefinition: {
                sampleHandler: {}
            }
        })).is.anErrorWithMessage(`Notification handler 'sampleHandler' is malformed: Function 'isAuthorized' is missing.`);
    });
});
//# sourceMappingURL=parseNotificationsTests.js.map