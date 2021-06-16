"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getPromiseStatus_1 = require("../../../../lib/common/utils/getPromiseStatus");
suite('getPromiseStatus', () => {
    test(`returns 'resolved' for a resolved promise.`, async () => {
        const promise = Promise.resolve();
        assertthat_1.assert.that(await getPromiseStatus_1.getPromiseStatus(promise)).is.equalTo('resolved');
    });
    test(`returns 'pending' for a pending promise.`, async () => {
        const promise = new Promise(() => {
            // Intentionally left empty.
        });
        assertthat_1.assert.that(await getPromiseStatus_1.getPromiseStatus(promise)).is.equalTo('pending');
    });
    test(`returns 'rejected' for a rejected promise.`, async () => {
        const promise = Promise.reject(new Error('Something went wrong.'));
        assertthat_1.assert.that(await getPromiseStatus_1.getPromiseStatus(promise)).is.equalTo('rejected');
    });
});
//# sourceMappingURL=getPromiseStatusTests.js.map