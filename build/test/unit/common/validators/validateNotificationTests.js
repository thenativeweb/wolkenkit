"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const validateNotification_1 = require("../../../../lib/common/validators/validateNotification");
suite('validateNotification', () => {
    let application;
    setup(async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base', language: 'javascript' });
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    test('throws an error if the published notification name is unknown.', async () => {
        const notification = {
            name: 'someUnknownNotification',
            data: {}
        };
        await assertthat_1.assert.that(async () => {
            validateNotification_1.validateNotification({ notification, application });
        }).is.throwingAsync(`Notification 'someUnknownNotification' not found.`);
    });
    test(`throws an error if the published notification's data does not match its schema.`, async () => {
        const notification = {
            name: 'complex',
            data: {}
        };
        await assertthat_1.assert.that(async () => {
            validateNotification_1.validateNotification({ notification, application });
        }).is.throwingAsync('Missing required property: message (at notification.data.message).');
    });
    test(`throws an error if the published notification's metadata does not match its schema.`, async () => {
        const notification = {
            name: 'complex',
            data: { message: 'foo' },
            metadata: {}
        };
        await assertthat_1.assert.that(async () => {
            validateNotification_1.validateNotification({ notification, application });
        }).is.throwingAsync('Missing required property: public (at notification.metadata.public).');
    });
});
//# sourceMappingURL=validateNotificationTests.js.map