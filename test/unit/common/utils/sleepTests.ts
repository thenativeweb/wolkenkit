import { assert } from 'assertthat';

import { sleep } from '../../../../lib/common/utils/sleep';

suite('sleep', (): void => {
  test('waits for the given amount of milliseconds.', async (): Promise<void> => {
    const start = Date.now();

    await sleep({ ms: 50 });

    const stop = Date.now();
    const duration = stop - start;

    // Actually, we should check for 50 milliseconds here, but due to the way
    // setTimeout is implemented, this can slightly be less than50 milliseconds.
    // Hence we decided to use 45 milliseconds (i.e. with 10% variance).
    assert.that(duration).is.atLeast(45);
  });
});
