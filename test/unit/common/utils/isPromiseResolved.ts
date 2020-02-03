import { assert } from 'assertthat';
import { isPromiseResolved } from 'lib/common/utils/isPromiseResolved';

suite('isPromiseResolved', (): void => {
  test('returns true for a resolved promise.', async (): Promise<void> => {
    const promise = Promise.resolve();

    assert.that(await isPromiseResolved(promise)).is.true();
  });

  test('returns false for a pending promise.', async (): Promise<void> => {
    const promise = new Promise((): void => {
      // Intentionally left empty.
    });

    assert.that(await isPromiseResolved(promise)).is.false();
  });

  test('returns false for a rejected promise.', async (): Promise<void> => {
    const promise = Promise.reject(new Error());

    assert.that(await isPromiseResolved(promise)).is.false();
  });
});
