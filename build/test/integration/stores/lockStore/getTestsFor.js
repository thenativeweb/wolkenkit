"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestsFor = void 0;
const assertthat_1 = require("assertthat");
const getShortId_1 = require("../../../shared/getShortId");
const sleep_1 = require("../../../../lib/common/utils/sleep");
const errors = __importStar(require("../../../../lib/common/errors"));
/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createLockStore }) {
    let lockStore, suffix, value;
    setup(async () => {
        suffix = getShortId_1.getShortId();
        lockStore = await createLockStore({ suffix });
        await lockStore.setup();
        value = JSON.stringify({ foo: 'bar' });
    });
    teardown(async function () {
        this.timeout(20000);
        await lockStore.destroy();
    });
    suite('acquireLock', () => {
        test('acquires a lock.', async () => {
            await lockStore.acquireLock({ value });
        });
        test('throws an error if the lock is already in place.', async () => {
            await lockStore.acquireLock({ value });
            await assertthat_1.assert.that(async () => {
                await lockStore.acquireLock({ value });
            }).is.throwingAsync((ex) => ex.code === errors.LockAcquireFailed.code && ex.message === 'Failed to acquire lock.');
        });
        test('supports locks with different values.', async () => {
            const otherValue = JSON.stringify({ foo: 'baz' });
            await lockStore.acquireLock({ value });
            await assertthat_1.assert.that(async () => {
                await lockStore.acquireLock({ value: otherValue });
            }).is.not.throwingAsync();
        });
        test('acquires a lock if the lock is already in place, but has expired.', async () => {
            await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });
            await sleep_1.sleep({ ms: 150 });
            await assertthat_1.assert.that(async () => {
                await lockStore.acquireLock({ value });
            }).is.not.throwingAsync();
        });
        test('throws an error if the expiration date is in the past.', async () => {
            await assertthat_1.assert.that(async () => {
                await lockStore.acquireLock({ value, expiresAt: Date.now() - 100 });
            }).is.throwingAsync((ex) => ex.code === errors.ExpirationInPast.code && ex.message === 'A lock must not expire in the past.');
        });
    });
    suite('isLocked', () => {
        test('returns false if the given lock does not exist.', async () => {
            const isLocked = await lockStore.isLocked({ value });
            assertthat_1.assert.that(isLocked).is.false();
        });
        test('returns true if the given lock exists.', async () => {
            await lockStore.acquireLock({ value });
            const isLocked = await lockStore.isLocked({ value });
            assertthat_1.assert.that(isLocked).is.true();
        });
        test('returns false if the given lock exists, but has expired.', async () => {
            await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });
            await sleep_1.sleep({ ms: 150 });
            const isLocked = await lockStore.isLocked({ value });
            assertthat_1.assert.that(isLocked).is.false();
        });
    });
    suite('renewLock', () => {
        test('throws an error if the given lock does not exist.', async () => {
            await assertthat_1.assert.that(async () => {
                await lockStore.renewLock({ value, expiresAt: Date.now() + 100 });
            }).is.throwingAsync((ex) => ex.code === errors.LockRenewalFailed.code && ex.message === 'Failed to renew lock.');
        });
        test('throws an error if the given lock exists, but has expired.', async () => {
            await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });
            await sleep_1.sleep({ ms: 150 });
            await assertthat_1.assert.that(async () => {
                await lockStore.renewLock({ value, expiresAt: Date.now() + 100 });
            }).is.throwingAsync((ex) => ex.code === errors.LockRenewalFailed.code && ex.message === 'Failed to renew lock.');
        });
        test('throws an error if the expiration date is in the past.', async () => {
            await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });
            await sleep_1.sleep({ ms: 50 });
            await assertthat_1.assert.that(async () => {
                await lockStore.acquireLock({ value, expiresAt: Date.now() - 100 });
            }).is.throwingAsync((ex) => ex.code === errors.ExpirationInPast.code && ex.message === 'A lock must not expire in the past.');
        });
        test('renews the lock.', async () => {
            // Please note that this test highly depends on the times used. If you
            // change the times, make sure to keep the logic.
            await lockStore.acquireLock({ value, expiresAt: Date.now() + 500 });
            await sleep_1.sleep({ ms: 450 });
            await lockStore.renewLock({ value, expiresAt: Date.now() + 500 });
            await sleep_1.sleep({ ms: 450 });
            // If renewing didn't work, now more time has passed than the original
            // expiration time, so the lock has expired. We can verify this by trying
            // to acquire the lock: If we can not acquire the lock, it is still active
            // and renewing did work.
            await assertthat_1.assert.that(async () => {
                await lockStore.acquireLock({ value });
            }).is.throwingAsync();
        });
    });
    suite('releaseLock', () => {
        test('releases the lock.', async () => {
            await lockStore.acquireLock({ value });
            await lockStore.releaseLock({ value });
            await assertthat_1.assert.that(async () => {
                await lockStore.acquireLock({ value });
            }).is.not.throwingAsync();
        });
        test('does not throw an error if the lock does not exist.', async () => {
            await assertthat_1.assert.that(async () => {
                await lockStore.releaseLock({ value });
            }).is.not.throwingAsync();
        });
        test('does not throw an error if the lock has expired.', async () => {
            await lockStore.acquireLock({ value, expiresAt: Date.now() + 100 });
            await sleep_1.sleep({ ms: 150 });
            await assertthat_1.assert.that(async () => {
                await lockStore.releaseLock({ value });
            }).is.not.throwingAsync();
        });
    });
};
exports.getTestsFor = getTestsFor;
//# sourceMappingURL=getTestsFor.js.map