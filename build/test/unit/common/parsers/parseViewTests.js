"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const parseView_1 = require("../../../../lib/common/parsers/parseView");
suite('parseView', () => {
    const viewDefinition = {
        queryHandlers: {}
    };
    test('does not return an error if everything is fine.', async () => {
        assertthat_1.assert.that(parseView_1.parseView({ viewDefinition })).is.not.anError();
    });
    test('returns an error if the given view definition is not an object.', async () => {
        assertthat_1.assert.that(parseView_1.parseView({ viewDefinition: undefined })).is.anErrorWithMessage(`View handler is not an object.`);
    });
    test('returns an error if query handlers are missing.', async () => {
        assertthat_1.assert.that(parseView_1.parseView({
            viewDefinition: {
                ...viewDefinition,
                queryHandlers: undefined
            }
        })).is.anErrorWithMessage(`Object 'queryHandlers' is missing.`);
    });
    test('returns an error if query handlers are not an object.', async () => {
        assertthat_1.assert.that(parseView_1.parseView({
            viewDefinition: {
                ...viewDefinition,
                queryHandlers: false
            }
        })).is.anErrorWithMessage(`Property 'queryHandlers' is not an object.`);
    });
    test('returns an error if a malformed query handler is found.', async () => {
        assertthat_1.assert.that(parseView_1.parseView({
            viewDefinition: {
                ...viewDefinition,
                queryHandlers: {
                    sampleQuery: false
                }
            }
        })).is.anErrorWithMessage(`Query handler 'sampleQuery' is malformed: Query handler is not an object.`);
    });
    test('returns an error if notification subscribers are not an object.', async () => {
        assertthat_1.assert.that(parseView_1.parseView({
            viewDefinition: {
                ...viewDefinition,
                notificationSubscribers: false
            }
        })).is.anErrorWithMessage(`Property 'notificationSubscribers' is not an object.`);
    });
    test('returns an error if a malformed notification subscriber is found.', async () => {
        assertthat_1.assert.that(parseView_1.parseView({
            viewDefinition: {
                ...viewDefinition,
                notificationSubscribers: {
                    sampleNotificationSubscriber: false
                }
            }
        })).is.anErrorWithMessage(`Notification subscriber 'sampleNotificationSubscriber' is malformed: Notification subscriber is not an object.`);
    });
});
//# sourceMappingURL=parseViewTests.js.map