"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestsFor = void 0;
const assertthat_1 = require("assertthat");
const uuid_1 = require("uuid");
const wait_for_signals_1 = require("wait-for-signals");
/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createPublisher, createSubscriber }) {
    let publisher, subscriber;
    setup(async () => {
        publisher = await createPublisher();
        subscriber = await createSubscriber();
    });
    test('published messages are received by the subscriber.', async () => {
        const channel = uuid_1.v4();
        const message = { data: uuid_1.v4() };
        const counter = wait_for_signals_1.waitForSignals({ count: 1 });
        await subscriber.subscribe({
            channel,
            async callback(receivedMessage) {
                assertthat_1.assert.that(receivedMessage).is.equalTo(message);
                await counter.signal();
            }
        });
        await publisher.publish({ channel, message });
        await counter.promise;
    });
    test('published messages are received by all subscribers.', async () => {
        const secondSubscriber = await createSubscriber();
        const channel = uuid_1.v4();
        const message = { data: uuid_1.v4() };
        const counterOne = wait_for_signals_1.waitForSignals({ count: 1 });
        await subscriber.subscribe({
            channel,
            async callback(receivedMessage) {
                assertthat_1.assert.that(receivedMessage).is.equalTo(message);
                await counterOne.signal();
            }
        });
        const counterTwo = wait_for_signals_1.waitForSignals({ count: 1 });
        await secondSubscriber.subscribe({
            channel,
            async callback(receivedMessage) {
                assertthat_1.assert.that(receivedMessage).is.equalTo(message);
                await counterTwo.signal();
            }
        });
        await publisher.publish({ channel, message });
        await Promise.all([counterOne.promise, counterTwo.promise]);
    });
    test('after unsubscribing no more messages are received.', async () => {
        const channel = uuid_1.v4();
        const message = { data: uuid_1.v4() };
        let receivedMessageCount = 0;
        const callback = async () => {
            receivedMessageCount += 1;
        };
        await subscriber.subscribe({ channel, callback });
        await subscriber.unsubscribe({ channel, callback });
        await publisher.publish({ channel, message });
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
        assertthat_1.assert.that(receivedMessageCount).is.equalTo(0);
    });
    test('can subscribe to all channels simultaneously.', async () => {
        const messageOne = { data: uuid_1.v4() };
        const messageTwo = { data: uuid_1.v4() };
        const receivedMessages = [];
        const counter = wait_for_signals_1.waitForSignals({ count: 2 });
        await subscriber.subscribe({
            channel: '*',
            async callback(receivedMessage) {
                receivedMessages.push(receivedMessage);
                await counter.signal();
            }
        });
        await publisher.publish({ channel: uuid_1.v4(), message: messageOne });
        await publisher.publish({ channel: uuid_1.v4(), message: messageTwo });
        await counter.promise;
        assertthat_1.assert.that(receivedMessages).is.equalTo([
            messageOne,
            messageTwo
        ]);
    });
};
exports.getTestsFor = getTestsFor;
//# sourceMappingURL=getTestsFor.js.map