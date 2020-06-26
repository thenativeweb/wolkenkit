import { assert } from 'assertthat';
import { isolated } from 'isolated';
import path from 'path';
import { readdirRecursive } from '../../../../../lib/common/utils/fs/readdirRecursive';
import { mkdir, touch } from 'shelljs';

suite('readdirRecursive', (): void => {
  test('returns empty arrays for an empty directory.', async (): Promise<void> => {
    const directory = await isolated();

    const { directories, files } = await readdirRecursive({ path: directory });

    assert.that(directories).is.equalTo([]);
    assert.that(files).is.equalTo([]);
  });

  test('returns a list of files for a directory that contains only files.', async (): Promise<void> => {
    const directory = await isolated();

    const bar = path.join(directory, 'bar.txt'),
          foo = path.join(directory, 'foo.txt');

    touch(bar);
    touch(foo);

    const { directories, files } = await readdirRecursive({ path: directory });

    assert.that(directories).is.equalTo([]);
    assert.that(files).is.equalTo([ 'bar.txt', 'foo.txt' ]);
  });

  test('returns a list of directories and files for a directory that contains directories and files.', async (): Promise<void> => {
    const directory = await isolated();

    const basDirectory = path.join(directory, 'bas'),
          baxDirectory = path.join(directory, 'bat', 'bax'),
          bazDirectory = path.join(directory, 'baz');

    const bar = path.join(directory, 'bar.txt'),
          baz = path.join(directory, 'baz', 'baz.txt'),
          foo = path.join(directory, 'foo.txt');

    mkdir('-p', basDirectory);
    mkdir('-p', baxDirectory);
    mkdir('-p', bazDirectory);

    touch(bar);
    touch(baz);
    touch(foo);

    const { directories, files } = await readdirRecursive({ path: directory });

    assert.that(directories).is.equalTo([
      'bas',
      'bat',
      path.join('bat', 'bax'),
      'baz'
    ]);
    assert.that(files).is.equalTo([
      'bar.txt',
      path.join('baz', 'baz.txt'),
      'foo.txt'
    ]);
  });
});
