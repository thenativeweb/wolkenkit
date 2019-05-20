'use strict';

const assert = require('assertthat');

const sleep = require('../../../../common/utils/sleep');

suite('sleep', () => {
  test('is a function.', async () => {
    assert.that(sleep).is.ofType('function');
  });

  test('throws an error if ms is missing.', async () => {
    await assert.that(async () => {
      await sleep({});
    }).is.throwingAsync('Ms is missing.');
  });

  test('waits for the given amount of milliseconds.', async () => {
    const start = Date.now();

    await sleep({ ms: 50 });

    const stop = Date.now();
    const duration = stop - start;

    assert.that(duration).is.atLeast(50);
  });
});
