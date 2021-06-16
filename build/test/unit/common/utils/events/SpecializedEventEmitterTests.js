"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const SpecializedEventEmitter_1 = require("../../../../../lib/common/utils/events/SpecializedEventEmitter");
suite('SpecializedEventEmitter', () => {
    let specializedEventEmitter;
    setup(async () => {
        specializedEventEmitter = new SpecializedEventEmitter_1.SpecializedEventEmitter();
    });
    suite('emit', () => {
        test('emits events.', async () => {
            let counter = 0;
            specializedEventEmitter.on((event) => {
                assertthat_1.assert.that(event).is.equalTo({ foo: 23, bar: 42 });
                counter += 1;
            });
            specializedEventEmitter.emit({ foo: 23, bar: 42 });
            assertthat_1.assert.that(counter).is.equalTo(1);
        });
    });
    suite('once', () => {
        test('handles events once.', async () => {
            let counter = 0;
            specializedEventEmitter.once(() => {
                counter += 1;
            });
            specializedEventEmitter.emit({ foo: 23, bar: 42 });
            specializedEventEmitter.emit({ foo: 23, bar: 42 });
            assertthat_1.assert.that(counter).is.equalTo(1);
        });
    });
    suite('off', () => {
        test('unsubscribes from events.', async () => {
            let counter = 0;
            const eventHandler = () => {
                counter += 1;
            };
            specializedEventEmitter.on(eventHandler);
            specializedEventEmitter.emit({ foo: 23, bar: 42 });
            specializedEventEmitter.off(eventHandler);
            specializedEventEmitter.emit({ foo: 23, bar: 42 });
            assertthat_1.assert.that(counter).is.equalTo(1);
        });
    });
    suite('removeAllListeners', () => {
        test('unsubscribes from events.', async () => {
            let counter = 0;
            const eventHandler = () => {
                counter += 1;
            };
            specializedEventEmitter.on(eventHandler);
            specializedEventEmitter.emit({ foo: 23, bar: 42 });
            specializedEventEmitter.removeAllListeners();
            specializedEventEmitter.emit({ foo: 23, bar: 42 });
            assertthat_1.assert.that(counter).is.equalTo(1);
        });
    });
});
//# sourceMappingURL=SpecializedEventEmitterTests.js.map