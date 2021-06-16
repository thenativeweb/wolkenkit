"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const sleep_1 = require("../../../../lib/common/utils/sleep");
suite('sleep', () => {
    test('waits for the given amount of milliseconds.', async () => {
        const start = Date.now();
        await sleep_1.sleep({ ms: 50 });
        const stop = Date.now();
        const duration = stop - start;
        // Actually, we should check for 50 milliseconds here, but due to the way
        // setTimeout is implemented, this can slightly be less than50 milliseconds.
        // Hence we decided to use 45 milliseconds (i.e. with 10% variance).
        assertthat_1.assert.that(duration).is.atLeast(45);
    });
});
//# sourceMappingURL=sleepTests.js.map