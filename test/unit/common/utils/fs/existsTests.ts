import { assert } from 'assertthat';
import { exists } from '../../../../../lib/common/utils/fs/exists';
import path from 'path';

suite('exists', (): void => {
  test('returns true if the given file exists.', async (): Promise<void> => {
    assert.that(await exists({ path: __filename })).is.true();
  });

  test('returns true if the given directory exists.', async (): Promise<void> => {
    assert.that(await exists({ path: __dirname })).is.true();
  });

  test('returns false if the given path does not exist.', async (): Promise<void> => {
    assert.that(await exists({ path: path.join(__dirname, 'does', 'not', 'exist') })).is.false();
  });
});
