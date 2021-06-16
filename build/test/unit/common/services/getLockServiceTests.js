"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
suite('getLockService', () => {
    let lockStore;
    let acquireLockCalled = false, isLockedCalled = false, releaseLockCalled = false, renewLockCalled = false;
    setup(async () => {
        acquireLockCalled = false;
        isLockedCalled = false;
        renewLockCalled = false;
        releaseLockCalled = false;
        lockStore = {
            async acquireLock() {
                acquireLockCalled = true;
            },
            async isLocked() {
                isLockedCalled = true;
                return true;
            },
            async renewLock() {
                renewLockCalled = true;
            },
            async releaseLock() {
                releaseLockCalled = true;
            },
            async setup() {
                // Intentionally left blank.
            },
            async destroy() {
                throw new Error('Invalid operation.');
            }
        };
    });
    test('passes calls to acquireLock through to lock store.', async () => {
        await lockStore.acquireLock({ value: 'foo' });
        assertthat_1.assert.that(acquireLockCalled).is.true();
    });
    test('passes calls to isLocked through to lock store.', async () => {
        await lockStore.isLocked({ value: 'foo' });
        assertthat_1.assert.that(isLockedCalled).is.true();
    });
    test('passes calls to renewLock through to lock store.', async () => {
        await lockStore.renewLock({ value: 'foo', expiresAt: Date.now() + 500 });
        assertthat_1.assert.that(renewLockCalled).is.true();
    });
    test('passes calls to releaseLock through to lock store.', async () => {
        await lockStore.releaseLock({ value: 'foo' });
        assertthat_1.assert.that(releaseLockCalled).is.true();
    });
});
//# sourceMappingURL=getLockServiceTests.js.map