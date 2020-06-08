import { assert } from 'assertthat';
import { getHash } from '../../../../../lib/stores/lockStore/shared/getHash';

suite('getHash', (): void => {
  test('returns the SHA256 hash for the given value.', async (): Promise<void> => {
    const hash = getHash({ value: 'the native web' });

    assert.that(hash).is.equalTo('55a1f59420da66b2c4c87b565660054cff7c2aad5ebe5f56e04ae0f2a20f00a9');
  });
});
