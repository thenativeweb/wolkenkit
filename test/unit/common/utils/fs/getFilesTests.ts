import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { getFiles } from '../../../../../lib/common/utils/fs/getFiles';
import path from 'path';

const directory = path.join(__dirname, '..', '..', '..', '..', 'shared', 'files');

suite('getFiles', (): void => {
  test('returns the files from the given directory recursively.', async (): Promise<void> => {
    const files = await getFiles({ directory });

    const mappedFiles = files.map((file): string => file.slice(directory.length));

    assert.that(mappedFiles).is.equalTo([
      `${path.sep}someDirectory${path.sep}someOtherFile.js`,
      `${path.sep}someDirectory${path.sep}someOtherFile.json`,
      `${path.sep}someFile.js`,
      `${path.sep}someFile.json`
    ]);
  });

  test('does not return the files recursively if recursive is set to false.', async (): Promise<void> => {
    const files = await getFiles({
      directory,
      recursive: false
    });

    const mappedFiles = files.map((file): string => file.slice(directory.length));

    assert.that(mappedFiles).is.equalTo([
      `${path.sep}someFile.js`,
      `${path.sep}someFile.json`
    ]);
  });

  test('only returns the files matching the given predicate.', async (): Promise<void> => {
    const files = await getFiles({
      directory,
      predicate: (entry): boolean => entry.name.endsWith('.json')
    });

    const mappedFiles = files.map((file): string => file.slice(directory.length));

    assert.that(mappedFiles).is.equalTo([
      `${path.sep}someDirectory${path.sep}someOtherFile.json`,
      `${path.sep}someFile.json`
    ]);
  });

  test('does not recursively return files matching the given predicate if recursive is set to false.', async (): Promise<void> => {
    const files = await getFiles({
      directory,
      recursive: false,
      predicate: (entry): boolean => entry.name.endsWith('.json')
    });

    const mappedFiles = files.map((file): string => file.slice(directory.length));

    assert.that(mappedFiles).is.equalTo([
      `${path.sep}someFile.json`
    ]);
  });

  test('throws an error if the given directory does not exist.', async (): Promise<void> => {
    await assert.that(async (): Promise<void> => {
      await getFiles({ directory: path.join(__dirname, 'does', 'not', 'exist') });
    }).is.throwingAsync((ex): boolean => (ex as CustomError).code === 'ENOENT');
  });
});
