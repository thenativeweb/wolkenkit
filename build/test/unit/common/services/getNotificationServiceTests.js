"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const createPublisher_1 = require("../../../../lib/messaging/pubSub/createPublisher");
const createSubscriber_1 = require("../../../../lib/messaging/pubSub/createSubscriber");
const getNotificationService_1 = require("../../../../lib/common/services/getNotificationService");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
suite('getNotificationService', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    let application, notificationService, publisher, pubSubChannelForNotifications, subscriber;
    suiteSetup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    setup(async () => {
        publisher = await createPublisher_1.createPublisher({ type: 'InMemory' });
        subscriber = await createSubscriber_1.createSubscriber({ type: 'InMemory' });
        pubSubChannelForNotifications = 'notifications';
        notificationService = getNotificationService_1.getNotificationService({
            application,
            publisher,
            channel: pubSubChannelForNotifications
        });
    });
    suite('publish', () => {
        test('throws an error if the published notification name is unknown.', async () => {
            const unknownNotificationName = 'someUnknownNotification';
            await assertthat_1.assert.that(async () => {
                await notificationService.publish(unknownNotificationName, {});
            }).is.throwingAsync(`Notification '${unknownNotificationName}' not found.`);
        });
        test(`throws an error if the published notification's data does not match its schema.`, async () => {
            await assertthat_1.assert.that(async () => {
                await notificationService.publish('complex', {});
            }).is.throwingAsync('Missing required property: message (at notification.data.message).');
        });
        test(`throws an error if the published notification's metadata does not match its schema.`, async () => {
            await assertthat_1.assert.that(async () => {
                await notificationService.publish('complex', { message: 'foo' }, {});
            }).is.throwingAsync('Missing required property: public (at notification.metadata.public).');
        });
        test('publishes the notification if everything is fine.', async () => {
            const notifications = [];
            await subscriber.subscribe({
                channel: pubSubChannelForNotifications,
                callback(notification) {
                    notifications.push(notification);
                }
            });
            await notificationService.publish('complex', { message: 'foo' }, { public: true });
            assertthat_1.assert.that(notifications.length).is.equalTo(1);
            assertthat_1.assert.that(notifications[0]).is.equalTo({
                name: 'complex',
                data: { message: 'foo' },
                metadata: { public: true }
            });
        });
    });
});
//# sourceMappingURL=getNotificationServiceTests.js.map