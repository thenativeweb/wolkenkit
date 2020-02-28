import { assert } from 'assertthat';
import { getPromiseStatus } from '../../../../lib/common/utils/getPromiseStatus';

suite('getPromiseStatus', (): void => {
  test(`returns 'resolved' for a resolved promise.`, async (): Promise<void> => {
    const promise = Promise.resolve();

    assert.that(await getPromiseStatus(promise)).is.equalTo('resolved');
  });

  test(`returns 'pending' for a pending promise.`, async (): Promise<void> => {
    const promise = new Promise((): void => {
      // Intentionally left empty.
    });

    assert.that(await getPromiseStatus(promise)).is.equalTo('pending');
  });

  test(`returns 'rejected' for a rejected promise.`, async (): Promise<void> => {
    const promise = Promise.reject(new Error());

    assert.that(await getPromiseStatus(promise)).is.equalTo('rejected');
  });
});
