import { assert } from 'assertthat';
import { getAbsolutePath } from '../../../../../lib/common/utils/path/getAbsolutePath';

suite('getAbsolutePath', (): void => {
  test('returns the given path if it already is absolute.', async (): Promise<void> => {
    const absolutePath = getAbsolutePath({ path: '/foo/bar', cwd: '/base' });

    assert.that(absolutePath).is.equalTo('/foo/bar');
  });

  test('returns the given path relative to the home directory if the path contains a tilde.', async (): Promise<void> => {
    const absolutePath = getAbsolutePath({ path: '~/foo/bar', cwd: '/base' });

    assert.that(absolutePath).is.startingWith('/');
    assert.that(absolutePath).is.not.startingWith('/base/');
  });

  test('returns the given path relative to the current working directory if it is relative.', async (): Promise<void> => {
    const absolutePath = getAbsolutePath({ path: 'foo/bar', cwd: '/base' });

    assert.that(absolutePath).is.equalTo('/base/foo/bar');
  });
});
